# Security and message delivery review — 14 October 2026

## Fixed delivery causes

- Socket.IO previously started lazily inside an API route. The persistent server now attaches it before accepting requests in development and production.
- The client used a build-time site URL, which could point at a different server. It now connects to the current origin.
- The previous production service worker cached APIs and authenticated pages. The replacement caches only immutable public bundles and deletes legacy private caches.
- A connected socket previously disabled polling entirely. Clients now require an acknowledged chat subscription and immediately refresh on reconnect; newest-page reconciliation runs every 10 seconds while live and every second when disconnected or unsubscribed.
- Successful HTTP writes now update the sender's cache immediately. Message IDs prevent duplicate socket/HTTP delivery, and update timestamps prevent stale events from reverting edits.
- Channel and direct-message sends now authorize the sender, insert the message, obtain display data, and identify allowed recipients in one parameterized PostgreSQL query. Socket publication uses that query's membership snapshot without another database round trip. Rejected authorization inserts nothing.
- Custom-server middleware uses a normalized localhost name for loopback/all-interface binds, avoiding local requests being incorrectly proxied back to the same server.

## Fixed security findings

- Removed global socket broadcasts of private/channel messages. Signed Clerk session tokens authenticate sockets; subscriptions require chat membership and the correct origin. Same-origin polling requests without an Origin header are recognized through Fetch Metadata and still require a signed token for the request origin. New-message publication uses membership at the authorized insert; edit/delete publication checks current membership.
- Added membership checks to both message-history APIs and room-token issuance. Call identities derive from the authenticated profile rather than a supplied username.
- Direct-message moderation now allows only the author to edit or delete their messages. Server moderators cannot delete someone else's private messages.
- Added bounded message/query validation and an HTTPS UploadThing attachment allowlist.
- Reset the query cache and observers when the signed-in account changes.
- Prevented conversations being created between members of different servers, and constrained channel pages to their requested server.
- Updated Next.js, Clerk, Axios, socket transports, and compatible development dependencies. Removed the vulnerable legacy PWA build chain, linkification dependency, query-string dependency, and direct UUID dependency.
- Removed Clerk secrets from Docker build arguments/layers, moved the container to Node.js 22, and enabled build-time lint/type checking.

## Verification

- All 31 regression tests pass, along with type checking, lint, and the production build. Tests use real HTTP and WebSocket clients with fixture users/database records, plus real RSA-signed JWTs checked by the Clerk SDK. Cases cover delivery to another client, unauthorized/private-chat access, rejected writes without publication, membership revocation, reconnects, rapid chat switching, duplicates, stale edits, polling recovery, attachment validation, and service worker cache boundaries.
- Local recipient delivery in the fixture tests was approximately 8–89 ms. These measurements exclude the deployed PostgreSQL database, proxy, and network.
- The actual production server was started locally. Unauthenticated history, call-token, and message-write requests returned 401; the service worker returned 200; socket authentication was available before any API bootstrap request.
- After the user restored the paused Supabase project, native Prisma connections and authenticated page rendering recovered. A requested dummy Clerk account and its private test hub were used for local verification against the configured database. Before the query optimization, the send API took 2,599 ms. After rebuilding, three sends took 1,450 / 354 / 337 ms, with the second independent socket receiving them in 1,447 / 352 / 336 ms. Tokens were prepared before the new measurements; the first request includes server/database warmup. Database timings were 870 / 328 / 317 ms. These are three local samples, not a production latency guarantee.
- A browser-submitted test message appeared in a second browser tab with the live connection badge. Both tabs used the dummy account; distinct authenticated users were covered by fixture tests, not a live two-account test.
- Real PostgreSQL checks verified channel insert authorization, parameterized identifiers, direct-message send and reply, recipient identities, and outsider denial. Additional temporary direct-message fixtures were rolled back. Existing users' hubs and messages were not modified.
- Production dependency audit: `npm audit --omit=dev` reports **0 known vulnerabilities**. The initial scan reported 50 findings, including 3 critical findings.
- Full dependency audit: **9 development/build-tool findings remain** (7 high, 2 moderate), in the Tailwind 3 / Next ESLint dependency chains. All compatible patches were applied; clearing the remaining findings requires changing those tooling chains. These packages are omitted from the runtime image. This is not a claim that the application has no possible vulnerabilities.

## Deployment limits

Rebuild the Docker image and reload both clients. See README.md for Nginx upgrade/forwarded-host headers. Immediate delivery assumes one persistent app instance; multiple instances require a shared Socket.IO adapter and sticky sessions for polling. Without that adapter, the reconciliation fetch still recovers missed messages.

At the 14 October review, the app had not been deployed. Production load and two distinct live authenticated accounts have not been verified. Local testing wrote only synthetic messages to the dummy account's private test hub in the configured database; no deployment changes were made. Subsequent Render verification is recorded below.

The framework upgrade follows the official [Next.js security release](https://nextjs.org/blog/august-2026-security-release). Socket hosting follows the [Socket.IO Next.js guidance](https://socket.io/how-to/use-with-nextjs).

## Render deployment follow-up — 16 October 2026

- Inspected https://connect-hub-70e6.onrender.com/ after the user reported slow sends and confirmed Render Free, linked to the repository's main branch.
- The remote main branch still points to `82299b5895ebcdc14c4b17ef6fae5f1369d1617d`. The fixes described above remain local, uncommitted working-tree changes and are absent from the deployed application.
- The deployed layout bundle `layout-ff2949bea5a916a0.js` contains the old socket provider: `NEXT_PUBLIC_SITE_URL`, `addTrailingSlash: false`, and no authenticated socket setup. Its Engine.IO handshake advertises the default 1,000,000-byte payload rather than the fixed server's 16,384-byte limit. The deployed send endpoint also lacks the new database Server-Timing measurement.
- Verified the public Clerk identity matches the local project's identity before using the existing dummy account's active session. Confirmed its private test hub through authenticated history, then measured two synthetic channel messages between two independent WebSocket clients using that account. HTTP responses took 2,133 / 1,900 ms; reception took 2,130 / 1,899 ms. The socket events therefore arrived with the write response rather than waiting for a later polling cycle in these samples. This points to the old write path's latency; no server-side database duration is available from that deployed version.
- Public sign-in requests measured 2,799 ms initially and 211 ms on the next request. An earlier redirect-following public HEAD check took 8,737 ms overall. These observations alone do not prove an idle wakeup; Render Free can additionally incur startup delays after inactivity.
- Re-ran the local regression suite: all 31 tests pass. The prior local production build, type checking, and lint passed; no application source changed during this deployment diagnosis.
- Only the dummy account's private test hub received synthetic messages. No real users' chats were changed. The fix has not been pushed or redeployed, so the live service remains on the old implementation.
