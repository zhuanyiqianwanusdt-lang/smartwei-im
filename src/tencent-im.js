let instance = null;

export async function connectTencentIm({ sdkAppId, userID, userSig, onReady, onNotReady, onConversations, onMessages, onKickedOut }) {
  const [{ default: TencentCloudChat }, { default: TIMUploadPlugin }] = await Promise.all([import("@tencentcloud/chat"), import("tim-upload-plugin")]);
  instance = TencentCloudChat.create({ SDKAppID: Number(sdkAppId) });
  instance.setLogLevel(import.meta.env.PROD ? 1 : 0);
  instance.registerPlugin({ "tim-upload-plugin": TIMUploadPlugin });
  instance.on(TencentCloudChat.EVENT.SDK_READY, onReady);
  instance.on(TencentCloudChat.EVENT.SDK_NOT_READY, onNotReady);
  instance.on(TencentCloudChat.EVENT.CONVERSATION_LIST_UPDATED, event => onConversations(event.data));
  instance.on(TencentCloudChat.EVENT.MESSAGE_RECEIVED, event => onMessages(event.data));
  instance.on(TencentCloudChat.EVENT.KICKED_OUT, onKickedOut);
  await instance.login({ userID, userSig });
  return {
    async sendText(to, text) {
      const message = instance.createTextMessage({ to, conversationType: TencentCloudChat.TYPES.CONV_C2C, payload: { text } });
      return instance.sendMessage(message);
    },
    async sendFile(to, file) {
      const message = instance.createFileMessage({ to, conversationType: TencentCloudChat.TYPES.CONV_C2C, payload: { file } });
      return instance.sendMessage(message);
    },
    async getMessages(conversationID, nextReqMessageID = "") { return instance.getMessageList({ conversationID, nextReqMessageID, count: 30 }); },
    async logout() { await instance.logout(); instance = null; },
  };
}

export async function requestImSession(username, password) {
  const login = await fetch("/api/auth/login", { method: "POST", headers: { "content-type": "application/json" }, credentials: "same-origin", body: JSON.stringify({ username, password }) });
  if (!login.ok) throw new Error((await login.json().catch(() => ({}))).error || "LOGIN_FAILED");
  const session = await fetch("/api/im/session", { credentials: "same-origin" });
  if (!session.ok) throw new Error((await session.json().catch(() => ({}))).error || "SESSION_FAILED");
  return session.json();
}
