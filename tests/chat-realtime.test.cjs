const { test } = require("node:test");
const assert = require("node:assert/strict");
const { createServer } = require("node:http");
const { once } = require("node:events");
const { performance } = require("node:perf_hooks");
const { io: connect } = require("socket.io-client");
const { createRealtimeServer, publishChatMessage, sameOrigin } = require("../lib/chat-realtime.cjs");
const loadTs = require("./load-ts.cjs");

async function fixture(t) {
    const members = new Set(["alice", "bob"]);
    const messages = [];
    const db = {
        profile: { findUnique: async ({ where }) => ({ id: where.userId }) },
        member: { findFirst: async ({ where }) => members.has(where.profileId) ? { id: where.profileId } : null },
        channel: {
            findFirst: async ({ where }) => where.id === "channel" && members.has(where.server.member.some.profileId) ? { id: "channel" } : null,
            findUnique: async () => ({ server: { member: [...members].map((profileId) => ({ profileId })) } }),
        },
        conversation: {
            findFirst: async ({ where }) => where.id === "conversation" && members.has(where.OR[0].memberOne.profileId) ? { memberOne: { id: "alice", profileId: "alice" }, memberTwo: { id: "bob", profileId: "bob" } } : null,
            findUnique: async () => ({ memberOne: { profileId: "alice" }, memberTwo: { profileId: "bob" } }),
        },
    };
    const create = async ({ data }) => {
        const message = { ...data, id: String(messages.length + 1), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
        messages.push(message);
        return message;
    };
    db.message = { create };
    db.directMessage = { create };
    const mocks = {
        "@/lib/db": { db },
        "@/lib/current-pagesprofile": { currentPagesUserId: async (req) => members.has(req.headers.authorization) ? req.headers.authorization : null },
        "@/lib/create-chat-message": { createChatMessage: async (input) => {
            if (!members.has(input.userId)) return null;
            const message = await create({ data: {
                content: input.content, fileUrl: input.fileUrl, memberId: input.userId,
                [input.type === "channel" ? "channelId" : "conversationId"]: input.chatId,
            } });
            return { message, recipientProfileIds: [...members] };
        } },
    };
    const handlers = {
        "/api/socket/messages": loadTs("pages/api/socket/messages/index.ts", mocks).default,
        "/api/socket/direct-messages": loadTs("pages/api/socket/direct-messages/index.ts", mocks).default,
    };
    const http = createServer(async (req, res) => {
        const url = new URL(req.url, "http://local");
        req.query = Object.fromEntries(url.searchParams);
        let body = "";
        for await (const chunk of req) body += chunk;
        req.body = body ? JSON.parse(body) : {};
        res.status = (code) => { res.statusCode = code; return res; };
        res.json = (value) => { res.setHeader("Content-Type", "application/json"); res.end(JSON.stringify(value)); return res; };
        const handler = handlers[url.pathname];
        if (handler) await handler(req, res);
        else res.end();
    });
    http.io = createRealtimeServer(http, { db, verifyToken: async (token) => {
        if (!["alice", "bob", "outsider", "expired"].includes(token)) throw new Error("Invalid token");
        return { sub: token, exp: token === "expired" ? Date.now() / 1000 - 1 : Date.now() / 1000 + 3600 };
    } });
    http.listen(0, "127.0.0.1");
    await once(http, "listening");
    const url = "http://127.0.0.1:" + http.address().port;
    const clients = [];
    const client = (token, origin = url, transport = "websocket") => {
        const socket = connect(url, { path: "/api/socket/io", transports: [transport], auth: { token }, extraHeaders: origin ? { Origin: origin } : { "Sec-Fetch-Site": "same-origin" }, reconnection: false });
        clients.push(socket);
        return socket;
    };
    t.after(async () => { clients.forEach((socket) => socket.disconnect()); await new Promise((resolve) => http.io.close(resolve)); });
    return { db, members, messages, http, url, client };
}
const connected = (socket) => Promise.race([once(socket, "connect"), once(socket, "connect_error").then(([error]) => { throw error; })]);
const subscribe = (socket, type, id) => socket.timeout(1000).emitWithAck("chat:subscribe", { type, id });
function event(socket, name) {
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => { socket.off(name, receive); reject(new Error("Delivery timed out: " + name)); }, 1500);
        const receive = (value) => { clearTimeout(timeout); resolve(value); };
        socket.once(name, receive);
    });
}

test("fresh server delivers channel and direct messages via HTTP to another client without a bootstrap request", async (t) => {
    const f = await fixture(t);
    const alice = f.client("alice"); const bob = f.client("bob"); const outsider = f.client("outsider");
    await Promise.all([connected(alice), connected(bob), connected(outsider)]);
    let leaked = 0;
    outsider.onAny((name) => { if (name.startsWith("chat:") && name.includes(":messages")) leaked++; });
    for (const [type, id, endpoint, query] of [["channel", "channel", "messages", "channelId=channel&serverId=server"], ["conversation", "conversation", "direct-messages", "conversationId=conversation"]]) {
        assert.deepEqual(await subscribe(alice, type, id), { ok: true });
        assert.deepEqual(await subscribe(bob, type, id), { ok: true });
        assert.deepEqual(await subscribe(outsider, type, id), { ok: false });
        const received = event(bob, "chat:" + id + ":messages");
        const start = performance.now();
        const response = await fetch(f.url + "/api/socket/" + endpoint + "?" + query, { method: "POST", headers: { "Content-Type": "application/json", Authorization: "alice" }, body: JSON.stringify({ content: "hello " + type }) });
        assert.equal(response.status, 200);
        const saved = await response.json();
        assert.deepEqual(await received, saved);
        const latency = performance.now() - start;
        assert.ok(latency < 1000, "Direct delivery must not wait for the 1s fallback poll");
        t.diagnostic(type + " HTTP-to-recipient latency: " + latency.toFixed(1) + " ms (fixture database)");
    }
    assert.equal(leaked, 0);
});
test("socket rejects missing authentication, invalid tokens, and cross-origin connections", async (t) => {
    const f = await fixture(t);
    for (const [token, origin] of [[null, f.url], ["invalid", f.url], ["expired", f.url], ["alice", "https://evil.test"]]) {
        const socket = f.client(token, origin);
        const [error] = await once(socket, "connect_error");
        assert.ok(error);
        assert.equal(socket.connected, false);
    }
});
test("revoked channel membership stops delivery even on an already subscribed socket", async (t) => {
    const f = await fixture(t);
    const bob = f.client("bob"); await connected(bob);
    assert.deepEqual(await subscribe(bob, "channel", "channel"), { ok: true });
    let leaked = false; bob.on("chat:channel:messages", () => { leaked = true; });
    f.members.delete("bob");
    await publishChatMessage(f.http.io, f.db, { type: "channel", id: "channel" }, { id: "private" });
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(leaked, false);
    assert.deepEqual(await subscribe(bob, "channel", "channel"), { ok: false });
});
test("reconnection can rejoin the chat and receive message updates", async (t) => {
    const f = await fixture(t);
    const bob = f.client("bob"); await connected(bob);
    assert.deepEqual(await subscribe(bob, "conversation", "conversation"), { ok: true });
    bob.disconnect(); bob.connect(); await connected(bob);
    assert.deepEqual(await subscribe(bob, "conversation", "conversation"), { ok: true });
    const received = event(bob, "chat:conversation:messages:update");
    await publishChatMessage(f.http.io, f.db, { type: "conversation", id: "conversation" }, { id: "edited", content: "updated" }, true);
    assert.equal((await received).content, "updated");
});
test("changing chats stops events from the previous room", async (t) => {
    const f = await fixture(t);
    const bob = f.client("bob"); await connected(bob);
    await subscribe(bob, "channel", "channel");
    await subscribe(bob, "conversation", "conversation");
    const serverSocket = [...f.http.io.sockets.sockets.values()][0];
    assert.equal([...serverSocket.rooms].some((room) => room.includes(":channel:channel:")), false);
});
test("reverse proxy accepts the public host and rejects unrelated origins", () => {
    assert.equal(sameOrigin({ headers: { origin: "https://chat.example.com", host: "web:3000", "x-forwarded-host": "chat.example.com" } }), true);
    assert.equal(sameOrigin({ headers: { origin: "https://evil.test", host: "chat.example.com" } }), false);
    assert.equal(sameOrigin({ headers: { host: "chat.example.com" } }), false);
    assert.equal(sameOrigin({ headers: { host: "chat.example.com", "sec-fetch-site": "same-origin" } }), true);
    assert.equal(sameOrigin({ headers: { host: "chat.example.com", "sec-fetch-site": "cross-site" } }), false);
});

test("a slow previous subscription cannot overwrite a newly selected chat", async (t) => {
    const f = await fixture(t);
    const bob = f.client("bob"); await connected(bob);
    let begin, release;
    const started = new Promise((resolve) => { begin = resolve; });
    const gate = new Promise((resolve) => { release = resolve; });
    const original = f.db.channel.findFirst;
    f.db.channel.findFirst = async (query) => { begin(); await gate; return original(query); };
    const previous = subscribe(bob, "channel", "channel");
    await started;
    assert.deepEqual(await subscribe(bob, "conversation", "conversation"), { ok: true });
    release();
    assert.deepEqual(await previous, { ok: false });
    const rooms = [...f.http.io.sockets.sockets.values()][0].rooms;
    assert.equal([...rooms].some((room) => room.includes(":channel:channel:")), false);
    assert.equal([...rooms].some((room) => room.includes(":conversation:conversation:")), true);
});

test("same-origin browser polling without an Origin header can authenticate and receive messages", { timeout: 5000 }, async (t) => {
    const f = await fixture(t);
    const bob = f.client("bob", null, "polling");
    await connected(bob);
    assert.deepEqual(await subscribe(bob, "channel", "channel"), { ok: true });
    const received = event(bob, "chat:channel:messages");
    await publishChatMessage(f.http.io, f.db, { type: "channel", id: "channel" }, { id: "polling-message" });
    assert.equal((await received).id, "polling-message");
});
