const { test } = require("node:test");
const assert = require("node:assert/strict");
const { generateKeyPairSync, sign } = require("node:crypto");
const { verifyToken } = require("@clerk/backend");
const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const jwtKey = publicKey.export({ type: "spki", format: "pem" });
function token(extra = {}) {
    const now = Math.floor(Date.now() / 1000);
    const encode = (data) => Buffer.from(JSON.stringify(data)).toString("base64url");
    const header = encode({ alg: "RS256", typ: "JWT", kid: "test-key" });
    const payload = encode({ iss: "https://clerk.test", sub: "user-alice", sid: "session-test", iat: now, nbf: now - 10, exp: now + 60, azp: "https://chat.test", ...extra });
    const input = header + "." + payload;
    return input + "." + sign("RSA-SHA256", Buffer.from(input), privateKey).toString("base64url");
}
test("Clerk verification accepts a signed session token for the correct origin", async () => {
    const claims = await verifyToken(token(), { jwtKey, authorizedParties: ["https://chat.test"] });
    assert.equal(claims.sub, "user-alice");
});
test("Clerk verification rejects forged, expired, and wrong-origin session tokens", async () => {
    const valid = token();
    const parts = valid.split(".");
    parts[1] = Buffer.from(JSON.stringify({ sub: "someone-else" })).toString("base64url");
    for (const value of [parts.join("."), token({ exp: Math.floor(Date.now() / 1000) - 60 }), token({ azp: "https://evil.test" })]) {
        await assert.rejects(() => verifyToken(value, { jwtKey, authorizedParties: ["https://chat.test"] }));
    }
});
