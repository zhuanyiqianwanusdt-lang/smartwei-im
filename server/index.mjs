import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import dotenv from "dotenv";
import TLSSigAPIv2 from "tls-sig-api-v2";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
dotenv.config({ path: resolve(root, ".env") });
const port = Number(process.env.SMARTWEI_API_PORT || 4319);
const sdkAppId = Number(process.env.TENCENT_IM_SDK_APP_ID || 0);
const secretKey = process.env.TENCENT_IM_SECRET_KEY?.trim() || "";
const operatorUserId = process.env.TENCENT_IM_OPERATOR_USER_ID?.trim() || "";
const sessionSecret = process.env.SMARTWEI_SESSION_SECRET?.trim() || "";
const adminUsername = process.env.SMARTWEI_ADMIN_USERNAME?.trim() || "";
const adminPassword = process.env.SMARTWEI_ADMIN_PASSWORD || "";
const callbackToken = process.env.TENCENT_IM_CALLBACK_TOKEN?.trim() || "";
const userSigTtl = Math.min(86400, Math.max(300, Number(process.env.TENCENT_IM_USER_SIG_TTL_SECONDS || 600)));
const configured = Boolean(sdkAppId && secretKey && operatorUserId && sessionSecret && adminUsername && adminPassword);
const listeners = new Set();
const loginWindows = new Map();

function json(response, status, body, headers = {}) {
  response.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...headers });
  response.end(JSON.stringify(body));
}

function readJson(request, maxBytes = 1024 * 1024) {
  return new Promise((resolveBody, reject) => {
    let size = 0;
    let raw = "";
    request.setEncoding("utf8");
    request.on("data", chunk => {
      size += Buffer.byteLength(chunk);
      if (size > maxBytes) { reject(new Error("BODY_TOO_LARGE")); request.destroy(); return; }
      raw += chunk;
    });
    request.on("end", () => {
      try { resolveBody(raw ? JSON.parse(raw) : {}); } catch { reject(new Error("INVALID_JSON")); }
    });
    request.on("error", reject);
  });
}

function safeEqual(left, right) {
  const a = Buffer.from(String(left));
  const b = Buffer.from(String(right));
  return a.length === b.length && timingSafeEqual(a, b);
}

function signSession(payload) {
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", sessionSecret).update(encoded).digest("base64url");
  return `${encoded}.${signature}`;
}

function getSession(request) {
  if (!sessionSecret) return null;
  const cookieName = "smartwei_session=";
  const token = (request.headers.cookie || "").split(";").map(part => part.trim()).find(part => part.startsWith(cookieName))?.slice(cookieName.length);
  if (!token) return null;
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;
  const expected = createHmac("sha256", sessionSecret).update(encoded).digest("base64url");
  if (!safeEqual(signature, expected)) return null;
  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
    return payload.exp > Math.floor(Date.now() / 1000) ? payload : null;
  } catch { return null; }
}

function requireSession(request, response) {
  const session = getSession(request);
  if (!session) json(response, 401, { ok: false, error: "UNAUTHORIZED" });
  return session;
}

function loginAllowed(ip) {
  const now = Date.now();
  const recent = (loginWindows.get(ip) || []).filter(timestamp => now - timestamp < 60_000);
  recent.push(now);
  loginWindows.set(ip, recent);
  return recent.length <= 10;
}

function verifyCallback(url) {
  if (!callbackToken) return false;
  const requestTime = url.searchParams.get("RequestTime") || "";
  const sign = url.searchParams.get("Sign") || "";
  const seconds = Number(requestTime);
  if (!Number.isFinite(seconds) || Math.abs(Date.now() / 1000 - seconds) > 60) return false;
  return safeEqual(sign.toLowerCase(), createHash("sha256").update(`${callbackToken}${requestTime}`).digest("hex"));
}

function broadcast(payload) {
  const line = `data: ${JSON.stringify(payload)}\n\n`;
  for (const response of listeners) response.write(line);
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);
  try {
    if (request.method === "GET" && url.pathname === "/api/health") {
      json(response, 200, { ok: true, service: "smartwei-im", configured });
      return;
    }
    if (request.method === "POST" && url.pathname === "/api/auth/login") {
      if (!loginAllowed(request.socket.remoteAddress || "unknown")) { json(response, 429, { ok: false, error: "TOO_MANY_ATTEMPTS" }); return; }
      if (!configured) { json(response, 503, { ok: false, error: "IM_NOT_CONFIGURED" }); return; }
      const body = await readJson(request, 16 * 1024);
      if (!safeEqual(body.username || "", adminUsername) || !safeEqual(body.password || "", adminPassword)) { json(response, 401, { ok: false, error: "INVALID_CREDENTIALS" }); return; }
      const exp = Math.floor(Date.now() / 1000) + 8 * 60 * 60;
      const token = signSession({ sub: adminUsername, exp, nonce: randomBytes(10).toString("hex") });
      json(response, 200, { ok: true }, { "set-cookie": `smartwei_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800` });
      return;
    }
    if (request.method === "POST" && url.pathname === "/api/auth/logout") {
      json(response, 200, { ok: true }, { "set-cookie": "smartwei_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0" });
      return;
    }
    if (request.method === "GET" && url.pathname === "/api/im/session") {
      if (!requireSession(request, response)) return;
      const userSig = new TLSSigAPIv2.Api(sdkAppId, secretKey).genSig(operatorUserId, userSigTtl);
      json(response, 200, { ok: true, sdkAppId, userID: operatorUserId, userSig, expiresAt: Math.floor(Date.now() / 1000) + userSigTtl });
      return;
    }
    if (request.method === "GET" && url.pathname === "/api/events") {
      if (!requireSession(request, response)) return;
      response.writeHead(200, { "content-type": "text/event-stream", "cache-control": "no-cache, no-transform", connection: "keep-alive", "x-accel-buffering": "no" });
      response.write("event: ready\ndata: {}\n\n");
      listeners.add(response);
      request.on("close", () => listeners.delete(response));
      return;
    }
    if (request.method === "POST" && url.pathname === "/api/tencent-im/callback") {
      if (!verifyCallback(url)) { json(response, 401, { ActionStatus: "FAIL", ErrorCode: 401, ErrorInfo: "invalid callback signature" }); return; }
      const body = await readJson(request);
      broadcast({ receivedAt: new Date().toISOString(), command: url.searchParams.get("CallbackCommand") || "", body });
      json(response, 200, { ActionStatus: "OK", ErrorCode: 0, ErrorInfo: "" });
      return;
    }
    json(response, 404, { ok: false, error: "NOT_FOUND" });
  } catch (error) {
    const status = error.message === "BODY_TOO_LARGE" ? 413 : error.message === "INVALID_JSON" ? 400 : 500;
    json(response, status, { ok: false, error: status === 500 ? "INTERNAL_ERROR" : error.message });
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`智慧微 IM API 已启动：http://127.0.0.1:${port}`);
  console.log(configured ? "腾讯 IM 配置：已注入" : "腾讯 IM 配置：未注入（安全演示模式）");
});
