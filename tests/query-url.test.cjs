const { test } = require("node:test");
const assert = require("node:assert/strict");
const { stringifyUrl } = require("./load-ts.cjs")("lib/query-url.ts");
test("chat query strings encode IDs and omit the missing cursor", () => {
    const url = stringifyUrl({ url: "/api/messages", query: { channelId: "id&scope=other", cursor: undefined } });
    const parsed = new URL(url, "https://chat.test");
    assert.equal(parsed.searchParams.get("channelId"), "id&scope=other");
    assert.equal(parsed.searchParams.has("scope"), false);
    assert.equal(parsed.searchParams.has("cursor"), false);
});
test("query updates retain the hash and remove an ended call parameter", () => {
    assert.equal(stringifyUrl({ url: "/conversation?video=true#message", query: { video: undefined } }), "/conversation#message");
});
