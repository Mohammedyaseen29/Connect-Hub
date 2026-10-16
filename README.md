# Connect Hub

## Development and verification

Use Node.js 22 LTS or newer. Configure Clerk, PostgreSQL/Prisma, UploadThing, and LiveKit credentials in an untracked .env file.

```sh
npm ci
npx prisma generate
npm run dev
```

Open http://localhost:3000. Start the app through these npm scripts: the custom server initializes Socket.IO before serving requests. Running next dev or next start directly bypasses realtime delivery.

```sh
npm test
npm run typecheck
npm run lint
npm run build
npm start
```

Tests use real HTTP and WebSocket clients with fixture authentication/database data. They cover channel and direct delivery, reconnection, authorization, revoked membership, duplicate events, and uncached recovery. They do not measure your deployed database or network.

## Docker / VPS deployment

```sh
docker compose up -d --build
```

The container starts a persistent Node server on port 3000. Runtime secrets come from .env. NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is required at build time. The socket client uses the current site's origin; NEXT_PUBLIC_SITE_URL is no longer needed for messaging.

For Nginx, pass WebSocket upgrade headers and the public host to the container. Define the map in the http context and the location in the site's existing TLS server block:

```nginx
map $http_upgrade $connection_upgrade {
    default upgrade;
    '' close;
}

location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection $connection_upgrade;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Host $http_host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_read_timeout 75s;
    proxy_buffering off;
}
```

Override incoming forwarded headers at the trusted reverse proxy. Configure Clerk to allow your public domain. Use one app instance for immediate socket delivery; multiple replicas require a shared Socket.IO adapter (such as Redis) and sticky sessions for the polling transport. A connected chat also fetches its newest page every 10 seconds to recover missed events; disconnected/unsubscribed chats fetch every second. Rejoining a chat immediately refreshes its messages.

After redeploying, reload both clients so they receive the new socket and service worker code. The new worker caches only public static bundles and deletes private caches left by the previous version.

To verify the deployment, sign in as two different users in separate browsers, open the same channel or direct conversation, and send, edit, and delete messages. Verify the recipient updates immediately. Disconnect/reconnect one browser and verify its missed messages appear. Check the browser network panel for a successful /api/socket/io WebSocket upgrade. An HTTP 503 from that route means the app was started without the custom server.

See [SECURITY_REVIEW.md](SECURITY_REVIEW.md) for the security findings, audit scope, and verification limits.

## Render deployment

Deploy this working tree's fixes to the Git branch connected to Render before rebuilding. Redeploying an older commit will keep the old message handlers and socket client.

Use a Docker Web Service with the included Dockerfile. Supply the existing service credentials as Render environment variables, including NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY for the image build. The image runs npm start, which starts the custom persistent server; do not override it with next start. Start with one service instance. Keep secrets out of Git and Docker build arguments.

For this app's existing Mumbai database, Singapore is the closest listed Render region. Compare database Server-Timing and end-to-end delivery after deployment before deciding on a region migration. Render requires creating a new service to change region. Free services may spin down after 15 minutes without incoming HTTP/WebSocket traffic; upgrading compute can avoid that idle startup delay but does not replace deploying the code fixes.

After Render reports the new commit as live, reload both clients. Verify the socket handshake advertises maxPayload 16384, signed-in clients successfully acknowledge chat:subscribe, and message POST responses include a Server-Timing db duration. Then measure sending from one account to a second account in the same channel. See [Render's WebSocket documentation](https://render.com/docs/websocket) and [Free service limits](https://render.com/docs/free).
