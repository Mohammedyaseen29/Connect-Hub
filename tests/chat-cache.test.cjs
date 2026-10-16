const { test } = require("node:test");
const assert = require("node:assert/strict");
const { QueryClient } = require("@tanstack/react-query");
const { upsertMessage, reconcileMessages } = require("../lib/chat-cache.cjs");
const message = (id, n, extra = {}) => ({ id, content: id, createdAt: new Date(n * 1000).toISOString(), updatedAt: new Date(n * 1000).toISOString(), ...extra });
const history = () => ({ pages: [{ items: [message("b", 2)], nextCursor: "b" }, { items: [message("a", 1)], nextCursor: null }], pageParams: [undefined, "b"] });

test("HTTP acknowledgement plus socket event displays a message exactly once", () => {
    const client = new QueryClient();
    client.setQueryData(["chat:one"], history());
    const newMessage = message("c", 3);
    client.setQueryData(["chat:one"], (data) => upsertMessage(data, newMessage));
    client.setQueryData(["chat:one"], (data) => upsertMessage(data, newMessage));
    const data = client.getQueryData(["chat:one"]);
    assert.deepEqual(data.pages[0].items.map((item) => item.id), ["c", "b"]);
    assert.deepEqual(data.pageParams, [undefined, "b"]);
    client.clear();
});
test("out-of-order delivery is sorted and stale events cannot revert an edit", () => {
    let data = upsertMessage(history(), message("d", 4));
    data = upsertMessage(data, message("c", 3));
    data = upsertMessage(data, message("c", 3, { updatedAt: new Date(5000).toISOString(), content: "edited" }));
    data = upsertMessage(data, message("c", 3));
    assert.deepEqual(data.pages[0].items.map((item) => item.id), ["d", "c", "b"]);
    assert.equal(data.pages[0].items[1].content, "edited");
});
test("polling recovers missed messages and deletes while preserving loaded history", () => {
    const data = reconcileMessages(history(), { items: [message("c", 3), message("b", 2, { deleted: true, updatedAt: new Date(4000).toISOString() })], nextCursor: null });
    assert.equal(data.pages[0].items[0].id, "c");
    assert.equal(data.pages[0].items[1].deleted, true);
    assert.equal(data.pages[1].items[0].id, "a");
    assert.equal(data.pages[0].nextCursor, "b");
});
test("an initially empty chat receives its first message through polling", () => {
    const data = reconcileMessages({ pages: [{ items: [], nextCursor: null }], pageParams: [undefined] }, { items: [message("first", 1)] });
    assert.equal(data.pages[0].items[0].id, "first");
});
test("events before the initial query do not corrupt infinite query pageParams", () => {
    assert.equal(upsertMessage(undefined, message("a", 1)), undefined);
});

test("editing a message outside loaded history does not insert it into the newest page", () => {
    const old = history();
    assert.equal(upsertMessage(old, message("older", 0), false), old);
});
