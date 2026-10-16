const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
function worker(caches = {}) {
    const handlers = {};
    const self = { location: { origin: "https://chat.test" }, addEventListener: (name, fn) => { handlers[name] = fn; }, clients: { claim: async () => {} } };
    vm.runInNewContext(fs.readFileSync("public/service-worker.js", "utf8"), { self, caches, URL, Set, Promise });
    return handlers;
}
test("service worker bypasses API responses, authenticated pages and external requests", () => {
    const handlers = worker();
    for (const url of ["https://chat.test/api/messages?channelId=private", "https://chat.test/api/socket/io?transport=polling", "https://chat.test/servers/private", "https://external.test/_next/static/file.js"]) {
        handlers.fetch({ request: { method: "GET", url }, respondWith() { throw new Error("Private response intercepted"); } });
    }
});
test("new service worker removes private caches from the legacy worker", async () => {
    const removed = [];
    const handlers = worker({ keys: async () => ["apis", "others", "next-data", "start-url", "cross-origin", "connect-hub-static-v2", "connect-hub-static-v3"], delete: async (name) => removed.push(name) });
    let pending;
    handlers.activate({ waitUntil: (promise) => { pending = promise; } });
    await pending;
    assert.deepEqual(removed.sort(), ["apis", "connect-hub-static-v2", "cross-origin", "next-data", "others", "start-url"]);
});
