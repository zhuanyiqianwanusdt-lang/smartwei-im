import { useMemo, useRef, useState } from "react";
import { Icon } from "@iconify/react";
import serviceIcon from "@iconify-icons/ri/customer-service-2-line";
import contactsIcon from "@iconify-icons/ri/contacts-book-2-line";
import chatIcon from "@iconify-icons/ri/chat-3-line";
import queueIcon from "@iconify-icons/ri/list-check-3";
import userAddIcon from "@iconify-icons/ri/user-add-line";
import qrIcon from "@iconify-icons/ri/qr-code-line";
import broadcastIcon from "@iconify-icons/ri/broadcast-line";
import settingsIcon from "@iconify-icons/ri/settings-3-line";
import helpIcon from "@iconify-icons/ri/book-open-line";
import searchIcon from "@iconify-icons/ri/search-line";
import addIcon from "@iconify-icons/ri/add-line";
import archiveIcon from "@iconify-icons/ri/archive-line";
import blockIcon from "@iconify-icons/ri/user-forbid-line";
import smileIcon from "@iconify-icons/ri/emotion-happy-line";
import attachmentIcon from "@iconify-icons/ri/attachment-2";
import micIcon from "@iconify-icons/ri/mic-line";
import aiIcon from "@iconify-icons/ri/ai-generate";
import forwardIcon from "@iconify-icons/ri/share-forward-line";
import calendarIcon from "@iconify-icons/ri/calendar-2-line";
import exportIcon from "@iconify-icons/ri/file-download-line";
import closeIcon from "@iconify-icons/ri/close-line";
import translateIcon from "@iconify-icons/ri/translate-2";
import timeIcon from "@iconify-icons/ri/time-line";
import moreIcon from "@iconify-icons/ri/more-2-fill";
import checkIcon from "@iconify-icons/ri/checkbox-circle-fill";
import bellIcon from "@iconify-icons/ri/notification-3-line";
import { connectTencentIm, requestImSession } from "./tencent-im.js";

const initialContacts = [
  {
    id: "c-001", name: "陈女士", code: "ZH-0825-001", preview: "请问这个套餐可以多人一起用吗？", time: "13:42", unread: 2,
    status: "active", remaining: "23h 18m", quota: "8/10 条", tags: ["重点客户", "新咨询"], source: "官网咨询入口",
    note: "关注团队协作和多客服接待，优先介绍企业版。",
    messages: [
      { id: 1, side: "in", type: "text", content: "你好，我想了解一下你们的客服系统。", time: "13:38" },
      { id: 2, side: "out", type: "text", content: "您好，欢迎咨询智慧微。请问您主要想解决单客服接待，还是团队协作场景？", time: "13:39", state: "已读" },
      { id: 3, side: "in", type: "text", content: "请问这个套餐可以多人一起用吗？", time: "13:42" },
    ],
  },
  {
    id: "c-002", name: "周先生", code: "ZH-0825-002", preview: "能接到我们自己的 App 里吗", time: "13:27", unread: 1,
    status: "active", remaining: "22h 57m", quota: "6/10 条", tags: ["技术咨询"], source: "扫码添加",
    note: "已有自研 App，关心 SDK 和消息回调。",
    messages: [{ id: 1, side: "in", type: "text", content: "能接到我们自己的 App 里吗？", time: "13:27" }],
  },
  {
    id: "c-003", name: "李经理", code: "ZH-0825-003", preview: "收到，我晚点整理需求", time: "12:56", unread: 0,
    status: "active", remaining: "22h 26m", quota: "4/10 条", tags: ["已报价"], source: "客户转介绍",
    note: "已发送企业版报价，明天下午跟进。",
    messages: [
      { id: 1, side: "out", type: "text", content: "企业版支持多坐席、自动分配和会话数据报表。", time: "12:51", state: "已读" },
      { id: 2, side: "in", type: "text", content: "收到，我晚点整理需求。", time: "12:56" },
    ],
  },
  {
    id: "c-004", name: "访客 7086", code: "ZH-0825-004", preview: "会话已结束", time: "11:08", unread: 0,
    status: "closed", remaining: "已关闭", quota: "10/10 条", tags: ["已结束"], source: "落地页", note: "咨询结束，无需再次跟进。",
    messages: [
      { id: 1, side: "in", type: "text", content: "好的，谢谢。", time: "11:07" },
      { id: 2, side: "out", type: "voice", content: "语音消息", duration: "0:03", time: "11:08", state: "已读" },
    ],
  },
];

const navGroups = [
  ["日常", [["contacts", "联系人", contactsIcon, 3], ["today", "今天该找谁", chatIcon], ["queue", "发送队列", queueIcon]]],
  ["获客", [["long-qr", "长话码加好友", userAddIcon], ["short-qr", "短一次性二维码加好友", qrIcon], ["broadcast", "群发", broadcastIcon]]],
  ["平台", [["chat", "聊天功能", serviceIcon], ["settings", "设置", settingsIcon, "还剩 24 小时"]]],
  ["帮助", [["guide", "使用教程", helpIcon], ["about", "产品介绍", serviceIcon], ["download", "下载 App", exportIcon]]],
];

const quickReplies = ["听不清语音，方便打字说下吗？", "看您关心团队协作，我给您介绍企业版。", "可以的，我先帮您确认具体使用人数。"];
const nowTime = () => new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", hour12: false });

function Sidebar({ activeView, onSelect }) {
  return <aside className="sidebar">
    <div className="brand"><div className="brand-mark"><Icon icon={serviceIcon} /></div><div><b>智慧微</b><span>客服工作台</span></div></div>
    <div className="workspace"><i /><div><b>演示企业</b><span>在线 · 腾讯 IM</span></div><Icon icon={moreIcon} /></div>
    <nav>
      {navGroups.map(([label, items]) => <section key={label}><p>{label}</p>{items.map(([id, text, icon, badge]) =>
        <button key={id} type="button" className={activeView === id ? "active" : ""} onClick={() => onSelect(id)}>
          <Icon icon={icon} /><span>{text}</span>{typeof badge === "number" && <em>{badge}</em>}{typeof badge === "string" && <i>{badge}</i>}
        </button>)}</section>)}
    </nav>
    <div className="operator"><div className="operator-avatar">林</div><div><b>客服 林晓</b><span><i />当前在线</span></div><Icon icon={settingsIcon} /></div>
  </aside>;
}

function ConversationList({ contacts, selectedId, onSelect, search, setSearch, filter, setFilter, onAdd }) {
  const list = contacts.filter(c => (filter === "all" || c.status === filter) && `${c.name}${c.code}${c.preview}`.toLowerCase().includes(search.toLowerCase()));
  return <section className="conversation-panel">
    <div className="panel-heading"><div><span>会话中心</span><h2>联系人</h2></div><button type="button" onClick={onAdd}><Icon icon={addIcon} /></button></div>
    <label className="search"><Icon icon={searchIcon} /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索联系人或消息" /></label>
    <div className="filters">{[["all", "全部"], ["active", "进行中"], ["closed", "已结束"]].map(([id, label]) => <button type="button" key={id} className={filter === id ? "active" : ""} onClick={() => setFilter(id)}>{label}</button>)}</div>
    <div className="summary"><span>最近有消息</span><b>{list.length} 个会话</b></div>
    <div className="conversation-list">
      {list.map(c => <button type="button" className={`conversation ${selectedId === c.id ? "active" : ""}`} key={c.id} onClick={() => onSelect(c.id)}>
        <div className={`avatar ${c.status === "closed" ? "closed" : ""}`}><Icon icon={c.status === "closed" ? archiveIcon : contactsIcon} /></div>
        <div className="conversation-copy"><div><b>{c.name}</b><time>{c.time}</time></div><div><span>{c.preview}</span>{c.unread > 0 && <em>{c.unread}</em>}</div><small className={c.status === "closed" ? "danger-pill" : "success-pill"}>{c.status === "closed" ? "会话已关闭" : `会话有效 · 剩 ${c.remaining}`}</small></div>
      </button>)}
      {!list.length && <div className="empty"><Icon icon={searchIcon} /><b>没有找到会话</b><span>换个关键词或条件试试</span></div>}
    </div>
  </section>;
}

function ChatHeader({ contact, blocked, onArchive, onBlock }) {
  return <header className="chat-header"><div className="chat-identity"><div className="avatar"><Icon icon={contactsIcon} /></div><div><div className="chat-name"><h1>{contact.name}</h1><span className={contact.status === "closed" ? "danger-pill" : "success-pill"}>{contact.status === "closed" ? "会话已关闭" : `会话有效 · 剩 ${contact.remaining}`}</span><span className="quota-pill">还能发 {contact.quota}</span></div><p>{contact.code} · {contact.source}</p></div></div><div className="header-actions"><button type="button" onClick={onArchive}><Icon icon={archiveIcon} />档案</button><button type="button" className={blocked ? "blocked" : "danger"} onClick={onBlock}><Icon icon={blockIcon} />{blocked ? "已拉黑" : "拉黑"}</button></div></header>;
}

function Message({ message }) {
  if (message.type === "notice") return <div className="notice"><Icon icon={timeIcon} />{message.content}</div>;
  return <div className={`message-row ${message.side}`}><div className="bubble-wrap">
    {message.type === "voice" ? <button className="voice" type="button"><Icon icon={micIcon} /><i><span /></i><b>{message.duration}</b></button>
      : message.type === "file" ? <div className="file"><Icon icon={attachmentIcon} /><div><b>{message.content}</b><span>{message.size}</span></div></div>
      : <div className="bubble">{message.content}</div>}
    <small>{message.time}{message.state ? ` · ${message.state}` : ""}</small>
  </div></div>;
}

function Tool({ icon, label, active, onClick }) { return <button className={`tool ${active ? "active" : ""}`} type="button" onClick={onClick}><Icon icon={icon} /><span>{label}</span></button>; }

function Composer({ disabled, draft, setDraft, onSend, onFile, onVoice, showAi, setShowAi, onSchedule, onExport, notify }) {
  const fileRef = useRef(null);
  return <section className="composer">
    <textarea value={draft} disabled={disabled} onChange={e => setDraft(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend(); } }} placeholder={disabled ? "当前会话不可发送消息" : "输入消息，按 Enter 发送"} />
    <div className="send-row"><button className="primary" type="button" disabled={disabled || !draft.trim()} onClick={onSend}>发送</button><span>Enter 发送 · Shift+Enter 换行</span></div>
    <div className="tools">
      <Tool icon={smileIcon} label="表情" onClick={() => setDraft(`${draft} 很高兴为您服务。`)} />
      <Tool icon={attachmentIcon} label="附件" onClick={() => fileRef.current?.click()} />
      <Tool icon={micIcon} label="录音" onClick={onVoice} />
      <Tool icon={translateIcon} label="话术" onClick={() => setDraft("您好，请问有什么可以帮您？")} />
      <Tool icon={aiIcon} label="AI 建议" active={showAi} onClick={() => setShowAi(v => !v)} />
      <Tool icon={forwardIcon} label="转发" onClick={() => notify("已复制当前消息，可切换联系人转发")} />
      <Tool icon={calendarIcon} label="定时发送" onClick={onSchedule} />
      <Tool icon={exportIcon} label="导出" onClick={onExport} />
      <input ref={fileRef} className="hidden" type="file" onChange={e => { if (e.target.files?.[0]) onFile(e.target.files[0]); e.target.value = ""; }} />
    </div>
    {showAi && <div className="suggestions"><b><Icon icon={aiIcon} />根据当前会话生成</b>{quickReplies.map(reply => <button type="button" key={reply} onClick={() => setDraft(reply)}>{reply}</button>)}</div>}
  </section>;
}

function Profile({ contact, onClose, onSave }) {
  const [note, setNote] = useState(contact.note);
  return <aside className="profile"><div className="panel-heading"><div><span>客户资料</span><h2>{contact.name}</h2></div><button type="button" onClick={onClose}><Icon icon={closeIcon} /></button></div><div className="profile-avatar"><Icon icon={contactsIcon} /></div><p className="profile-id">{contact.code}</p><dl><div><dt>来源</dt><dd>{contact.source}</dd></div><div><dt>状态</dt><dd>{contact.status === "closed" ? "已结束" : "进行中"}</dd></div><div><dt>标签</dt><dd className="tags">{contact.tags.map(t => <span key={t}>{t}</span>)}</dd></div></dl><label><span>客服备注</span><textarea value={note} onChange={e => setNote(e.target.value)} /></label><button className="primary wide" type="button" onClick={() => onSave(note)}><Icon icon={checkIcon} />保存客户档案</button></aside>;
}

function Modal({ type, onClose, onCreate }) {
  const [name, setName] = useState(""); const [date, setDate] = useState("2026-08-26"); const [time, setTime] = useState("09:00"); const [content, setContent] = useState("您好，昨天沟通的资料已经为您整理好，可以继续聊聊您的需求。");
  const isAdd = type === "add";
  return <div className="modal-backdrop" onMouseDown={onClose}><section className="modal" role="dialog" aria-modal="true" onMouseDown={e => e.stopPropagation()}><div className="panel-heading"><div><span>{isAdd ? "新联系人" : "消息计划"}</span><h2>{isAdd ? "添加腾讯 IM 账号" : "创建定时发送"}</h2></div><button type="button" onClick={onClose}><Icon icon={closeIcon} /></button></div>{isAdd ? <label><span>账号或备注名</span><input autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="输入 UserID 或联系人名称" /></label> : <><div className="form-grid"><label><span>日期</span><input type="date" value={date} onChange={e => setDate(e.target.value)} /></label><label><span>时间</span><input type="time" value={time} onChange={e => setTime(e.target.value)} /></label></div><label><span>发送内容</span><textarea value={content} onChange={e => setContent(e.target.value)} /></label><p className="hint"><Icon icon={timeIcon} />计划会进入发送队列，可在执行前取消。</p></>}<div className="modal-actions"><button type="button" onClick={onClose}>取消</button><button className="primary" type="button" disabled={isAdd ? !name.trim() : !date || !time || !content.trim()} onClick={() => onCreate(isAdd ? { name: name.trim() } : { date, time, content })}>{isAdd ? "添加联系人" : "创建计划"}</button></div></section></div>;
}

function ConnectModal({ onClose, onConnect }) {
  const [username, setUsername] = useState(""); const [password, setPassword] = useState(""); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  const submit = async () => { setBusy(true); setError(""); try { await onConnect(username, password); } catch (reason) { setError(reason.message === "IM_NOT_CONFIGURED" ? "服务器尚未注入腾讯 IM 密钥" : "登录或腾讯 IM 连接失败"); setBusy(false); } };
  return <div className="modal-backdrop" onMouseDown={onClose}><section className="modal connect-modal" role="dialog" aria-modal="true" onMouseDown={e => e.stopPropagation()}><div className="panel-heading"><div><span>真实接入</span><h2>连接腾讯云 IM</h2></div><button type="button" onClick={onClose}><Icon icon={closeIcon} /></button></div><p className="connect-copy">使用智慧微客服账号登录。SecretKey 只保存在服务端，不会进入浏览器。</p><label><span>客服账号</span><input autoFocus value={username} onChange={e => setUsername(e.target.value)} autoComplete="username" /></label><label><span>密码</span><input type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" onKeyDown={e => { if (e.key === "Enter" && username && password) submit(); }} /></label>{error && <p className="form-error">{error}</p>}<div className="modal-actions"><button type="button" onClick={onClose}>取消</button><button className="primary" type="button" disabled={busy || !username || !password} onClick={submit}>{busy ? "连接中…" : "连接 IM"}</button></div></section></div>;
}

function Placeholder({ view, onBack }) {
  const labels = Object.fromEntries(navGroups.flatMap(([, items]) => items.map(([id, label]) => [id, label])));
  return <main className="placeholder"><div><Icon icon={settingsIcon} /></div><span>智慧微独立项目</span><h1>{labels[view]}</h1><p>该模块已进入独立功能边界，当前优先完成客服主链路。</p><button className="primary" type="button" onClick={onBack}>返回联系人工作台</button></main>;
}

export function App() {
  const [contacts, setContacts] = useState(initialContacts); const [selectedId, setSelectedId] = useState(initialContacts[0].id); const [view, setView] = useState("contacts");
  const [search, setSearch] = useState(""); const [filter, setFilter] = useState("all"); const [draft, setDraft] = useState(""); const [showAi, setShowAi] = useState(false);
  const [profile, setProfile] = useState(false); const [modal, setModal] = useState(""); const [blockedIds, setBlockedIds] = useState([]); const [toast, setToast] = useState(""); const [imStatus, setImStatus] = useState("demo"); const imClient = useRef(null);
  const selected = useMemo(() => contacts.find(c => c.id === selectedId) || contacts[0], [contacts, selectedId]); const blocked = blockedIds.includes(selected.id); const disabled = blocked || selected.status === "closed";
  const notify = message => { setToast(message); window.setTimeout(() => setToast(""), 2500); };
  const append = message => setContacts(list => list.map(c => c.id === selected.id ? { ...c, preview: message.content, time: message.time || "计划", messages: [...c.messages, message] } : c));
  const send = async () => { const content = draft.trim(); if (!content || disabled) return; try { if (imStatus === "connected" && selected.imUserId) await imClient.current.sendText(selected.imUserId, content); append({ id: Date.now(), side: "out", type: "text", content, time: nowTime(), state: imStatus === "connected" ? "已送达" : "演示" }); setDraft(""); setShowAi(false); } catch { notify("消息发送失败，请检查 IM 连接"); } };
  const attach = async file => { try { if (imStatus === "connected" && selected.imUserId) await imClient.current.sendFile(selected.imUserId, file); append({ id: Date.now(), side: "out", type: "file", content: file.name, size: `${Math.max(1, Math.round(file.size / 1024))} KB`, time: nowTime(), state: imStatus === "connected" ? "已送达" : "演示" }); notify("附件已加入当前会话"); } catch { notify("附件发送失败，请检查文件类型和 IM 连接"); } };
  const exportChat = () => { const body = [`智慧微会话导出 - ${selected.name}`, `联系人编号：${selected.code}`, "", ...selected.messages.map(m => `[${m.time}] ${m.side === "out" ? "客服" : selected.name}：${m.content}`)].join("\n"); const url = URL.createObjectURL(new Blob([body], { type: "text/plain;charset=utf-8" })); const a = document.createElement("a"); a.href = url; a.download = `智慧微_${selected.name}_会话记录.txt`; a.click(); URL.revokeObjectURL(url); notify("会话记录已导出"); };
  const addContact = name => { const id = `c-${Date.now()}`; const item = { id, imUserId: name, name, code: `ZH-${String(Date.now()).slice(-6)}`, preview: "新联系人，暂时没有消息", time: "刚刚", unread: 0, status: "active", remaining: "24h 00m", quota: "10/10 条", tags: ["新联系人"], source: "手动添加", note: "", messages: [] }; setContacts(list => [item, ...list]); setSelectedId(id); setModal(""); notify("联系人已添加到智慧微"); };
  const connect = async (username, password) => {
    const session = await requestImSession(username, password);
    setImStatus("connecting");
    imClient.current = await connectTencentIm({
      ...session,
      onReady: () => { setImStatus("connected"); setModal(""); notify("腾讯 IM 已连接"); },
      onNotReady: () => setImStatus("connecting"),
      onKickedOut: () => { setImStatus("offline"); notify("当前客服账号已在其他设备登录"); },
      onConversations: conversations => {
        const mapped = conversations.filter(item => item.type === "C2C" || item.conversationID?.startsWith("C2C")).map((item, index) => {
          const userID = item.userProfile?.userID || item.conversationID?.replace(/^C2C/, "") || `visitor-${index}`;
          return { id: item.conversationID, conversationID: item.conversationID, imUserId: userID, name: item.userProfile?.nick || userID, code: userID, preview: item.lastMessage?.messageForShow || "暂无消息", time: item.lastMessage?.lastTime ? new Date(item.lastMessage.lastTime * 1000).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", hour12: false }) : "", unread: item.unreadCount || 0, status: "active", remaining: "24h 00m", quota: "10/10 条", tags: ["腾讯 IM"], source: "腾讯云 IM", note: "", messages: [] };
        });
        if (mapped.length) { setContacts(mapped); setSelectedId(current => mapped.some(item => item.id === current) ? current : mapped[0].id); }
      },
      onMessages: messages => setContacts(list => list.map(contact => {
        const incoming = messages.filter(message => message.conversationID === contact.conversationID);
        if (!incoming.length) return contact;
        const converted = incoming.map(message => ({ id: message.ID || `${message.time}-${Math.random()}`, side: message.flow === "out" ? "out" : "in", type: message.type === "TIMTextElem" ? "text" : "file", content: message.payload?.text || message.payload?.fileName || "收到一条新消息", size: "腾讯 IM", time: new Date((message.time || Date.now() / 1000) * 1000).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", hour12: false }) }));
        return { ...contact, preview: converted.at(-1).content, unread: contact.id === selectedId ? 0 : contact.unread + converted.length, messages: [...contact.messages, ...converted] };
      })),
    });
  };

  return <div className="app-shell">
    <Sidebar activeView={view} onSelect={setView} />
    {view !== "contacts" ? <Placeholder view={view} onBack={() => setView("contacts")} /> : <>
      <ConversationList contacts={contacts} selectedId={selected.id} onSelect={id => { setSelectedId(id); setProfile(false); setDraft(""); }} search={search} setSearch={setSearch} filter={filter} setFilter={setFilter} onAdd={() => setModal("add")} />
      <main className="chat-panel"><ChatHeader contact={selected} blocked={blocked} onArchive={() => setProfile(true)} onBlock={() => { setBlockedIds(ids => blocked ? ids.filter(id => id !== selected.id) : [...ids, selected.id]); notify(blocked ? "已恢复该联系人" : "已拉黑该联系人"); }} />
        <div className="translation"><Icon icon={translateIcon} /><span>这位客户的消息将保留原文</span><button type="button" onClick={() => notify("已开启中英双语辅助")}>开启翻译</button></div>
        <section className="message-stream"><div className="date"><span>今天</span></div>{selected.messages.length ? selected.messages.map(m => <Message message={m} key={m.id} />) : <div className="empty chat-empty"><Icon icon={chatIcon} /><b>开始一段新会话</b><span>从下面输入第一条消息</span></div>}{disabled && <div className="closed-notice">{blocked ? "该联系人已拉黑，恢复后才能继续发送" : "会话已结束，双方防发第一条消息才可继续"}</div>}</section>
        <Composer disabled={disabled} draft={draft} setDraft={setDraft} onSend={send} onFile={attach} onVoice={() => { append({ id: Date.now(), side: "out", type: "voice", content: "语音消息", duration: "0:03", time: nowTime(), state: "已送达" }); notify("录音已发送"); }} showAi={showAi} setShowAi={setShowAi} onSchedule={() => setModal("schedule")} onExport={exportChat} notify={notify} />
      </main>
      {profile && <Profile key={selected.id} contact={selected} onClose={() => setProfile(false)} onSave={note => { setContacts(list => list.map(c => c.id === selected.id ? { ...c, note } : c)); setProfile(false); notify("客户档案已保存"); }} />}
    </>}
    <div className={`topbar ${imStatus}`}><span><i />{imStatus === "connected" ? "腾讯 IM 已连接" : imStatus === "connecting" ? "腾讯 IM 连接中" : "腾讯 IM 安全演示"}</span><button type="button" onClick={() => setModal("connect")}>{imStatus === "connected" ? "重新登录" : "连接真实 IM"}</button><Icon icon={bellIcon} /></div>
    {modal === "connect" ? <ConnectModal onClose={() => setModal("")} onConnect={connect} /> : modal && <Modal type={modal} onClose={() => setModal("")} onCreate={data => { if (modal === "add") addContact(data.name); else { append({ id: Date.now(), side: "system", type: "notice", content: `已创建 ${data.date} ${data.time} 的定时消息：${data.content}` }); setModal(""); notify("定时发送计划已创建"); } }} />}
    {toast && <div className="toast"><Icon icon={checkIcon} />{toast}</div>}
  </div>;
}
