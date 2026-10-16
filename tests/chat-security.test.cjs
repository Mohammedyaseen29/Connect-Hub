const { test } = require("node:test");
const assert = require("node:assert/strict");
const loadTs = require("./load-ts.cjs");
const { messageCreateSchema } = loadTs("lib/message-validation.ts");

function response() {
    return { statusCode: 200, headers: {}, socket: {}, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; }, setHeader(name, value) { this.headers[name] = value; } };
}
for (const [name, id] of [["messages", "channelId"], ["direct-messages", "conversationId"]]) {
    test(name + " history rejects unauthenticated and nonmember users before reading messages", async () => {
        for (const profile of [null, { id: "outsider" }]) {
            const db = {
                channel: { findFirst: async () => null },
                conversation: { findFirst: async () => null },
                message: { findMany() { throw new Error("Unauthorized read"); } },
                directMessage: { findMany() { throw new Error("Unauthorized read"); } },
            };
            const { GET } = loadTs("app/api/" + name + "/route.ts", { "@/lib/db": { db }, "@/lib/current-profile": { currentProfile: async () => profile } });
            const result = await GET(new Request("http://local/api/" + name + "?" + id + "=private"));
            assert.equal(result.status, profile ? 404 : 401);
        }
    });
    test(name + " history is uncached and checks chat membership", async () => {
        let accessChecked = false;
        const check = async ({ where }) => { accessChecked = true; assert.equal(where.id, "private"); return { id: "private" }; };
        const read = async ({ where }) => { assert.ok(accessChecked); assert.equal(where[id], "private"); return []; };
        const db = { channel: { findFirst: check }, conversation: { findFirst: check }, message: { findMany: read }, directMessage: { findMany: read } };
        const { GET } = loadTs("app/api/" + name + "/route.ts", { "@/lib/db": { db }, "@/lib/current-profile": { currentProfile: async () => ({ id: "member" }) } });
        const result = await GET(new Request("http://local/api/" + name + "?" + id + "=private"));
        assert.equal(result.status, 200);
        assert.match(result.headers.get("cache-control"), /no-store/);
        assert.deepEqual(await result.json(), { items: [], nextCursor: null });
    });
    test(name + " sending validates input before database work", async () => {
        const handler = loadTs("pages/api/socket/" + name + "/index.ts", { "@/lib/db": { db: {} }, "@/lib/current-pagesprofile": { currentPagesUserId: async () => "member" } }).default;
        for (const body of [{ content: " " }, { content: "x".repeat(4001) }, { content: "file", fileUrl: "javascript:alert(1)" }]) {
            const res = response();
            await handler({ method: "POST", query: { [id]: "private", serverId: "server" }, body }, res);
            assert.equal(res.statusCode, 400);
        }
    });
}
test("attachment URLs reject script schemes and untrusted hosts", () => {
    for (const fileUrl of ["javascript:alert(1)", "http://utfs.io/f/file.pdf", "https://evil.test/file.pdf"]) {
        assert.equal(messageCreateSchema.safeParse({ content: "file", fileUrl }).success, false);
    }
    assert.equal(messageCreateSchema.safeParse({ content: "file", fileUrl: "https://utfs.io/f/file.pdf" }).success, true);
});
test("server moderators cannot delete the other participant's direct messages", async () => {
    const db = {
        conversation: { findFirst: async () => ({ memberOne: { id: "moderator", profileId: "me" }, memberTwo: { id: "other", profileId: "them" } }) },
        directMessage: { findFirst: async () => ({ id: "message", memberId: "other", deleted: false }), update() { throw new Error("Unauthorized write"); } },
    };
    const handler = loadTs("pages/api/socket/direct-messages/[directMessageId].ts", { "@/lib/db": { db }, "@/lib/current-pagesprofile": { currentPagesProfile: async () => ({ id: "me" }) } }).default;
    const res = response();
    await handler({ method: "DELETE", query: { directMessageId: "message", conversationId: "private" }, body: {} }, res);
    assert.equal(res.statusCode, 403);
});
test("call tokens require authentication and room membership", async () => {
    for (const profile of [null, { id: "outsider" }]) {
        const db = { channel: { findFirst: async () => null }, conversation: { findFirst: async () => null } };
        const { GET } = loadTs("app/api/livekit/route.ts", { "@/lib/db": { db }, "@/lib/current-profile": { currentProfile: async () => profile } });
        const result = await GET({ nextUrl: new URL("http://local/api/livekit?room=private&username=someone-else") });
        assert.equal(result.status, profile ? 404 : 401);
    }
});

for (const name of ["messages", "direct-messages"]) {
    test(name + " sending rejects a signed-in nonmember and never broadcasts", async () => {
        const handler = loadTs("pages/api/socket/" + name + "/index.ts", {
            "@/lib/current-pagesprofile": { currentPagesUserId: async () => "outsider" },
            "@/lib/create-chat-message": { createChatMessage: async () => null },
            "@/lib/chat-realtime.cjs": { broadcastChatMessage() { throw new Error("Unauthorized broadcast"); } },
        }).default;
        const res = response();
        await handler({ method: "POST", query: { channelId: "private", conversationId: "private", serverId: "server" }, body: { content: "not permitted" } }, res);
        assert.equal(res.statusCode, 404);
    });
}
