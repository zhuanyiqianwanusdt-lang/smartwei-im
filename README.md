# 智慧微 · 独立客服 IM

智慧微是独立客服工作台，视觉和操作流程参考桌面录屏中的“微聊”，底层专用腾讯云即时通信 IM。该项目不会读取或复用柏木 V2 的配置。

## 已实现

- 三栏客服工作台：功能导航、会话列表、消息区。
- 联系人搜索与会话状态筛选。
- 文本、附件和语音消息交互。
- 客户档案、备注、标签和拉黑状态。
- 快捷话术、AI 回复建议、定时发送和会话导出。
- 腾讯 Chat Web SDK 的按需加载、登录、会话更新、消息接收和文本/文件发送封装。
- 服务端客服登录、HttpOnly 会话、UserSig 安全生成、SSE 事件流和腾讯回调验签。
- 未配置凭据时自动保持安全演示模式。

## 安全配置

1. 项目根目录已经准备好受 `.gitignore` 保护的 `.env`；`.env.example` 只作为字段模板。
2. 在本机 `.env` 中填写独立客服密码、强随机会话密钥、腾讯 IM SecretKey 和回调 Token。
3. SecretKey 不得写入 `src/`、Vite 环境变量或浏览器存储。
4. 正式部署时把 `/api` 反向代理到仅监听 `127.0.0.1:4319` 的服务端。
5. 腾讯控制台回调地址使用 HTTPS：`https://智慧微接口域名/api/tencent-im/callback`。

腾讯官方要求 UserSig 在服务端生成，避免将 SecretKey 暴露给 Web 客户端；回调鉴权使用 `Sign=sha256(Token+RequestTime)`，并校验时间戳以防重放：

- https://cloud.tencent.com/document/product/269/32688
- https://cloud.tencent.com/document/product/269/1522

## 本地运行

```powershell
npm run dev:server
npm run dev -- --host 0.0.0.0 --port 4173 --strictPort
```

前端默认地址：`http://127.0.0.1:4173/`  
服务端健康检查：`http://127.0.0.1:4319/api/health`

## 验证命令

```powershell
npm run build
npm run test:sites
```

真实 IM 验收还需要腾讯控制台中的 SecretKey、回调配置、允许域名，以及两个独立 UserID 进行双端收发测试。
