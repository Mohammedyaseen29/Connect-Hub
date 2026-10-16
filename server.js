const { createServer } = require("node:http");
const next = require("next");
const { loadEnvConfig } = require("@next/env");
const { PrismaClient } = require("@prisma/client");
const { verifyToken } = require("@clerk/backend");
const { createRealtimeServer } = require("./lib/chat-realtime.cjs");

const dev = process.argv.includes("--dev");
process.env.NODE_ENV = dev ? "development" : "production";
loadEnvConfig(process.cwd(), dev);
const hostname = process.env.HOSTNAME || "0.0.0.0";
const port = Number(process.env.PORT || 3000);
// Next normalizes loopback/all-interface addresses to localhost in middleware URLs.
const nextHostname = ["0.0.0.0", "127.0.0.1", "::"].includes(hostname) ? "localhost" : hostname;
const app = next({ dev, hostname: nextHostname, port });
const db = new PrismaClient();

app.prepare().then(() => {
  const httpServer = createServer(app.getRequestHandler());
  httpServer.io = createRealtimeServer(httpServer, { db, verifyToken });
  httpServer.once("error", (error) => {
    console.error(error);
    process.exit(1);
  });
  httpServer.listen(port, hostname, () => {
    console.log(`Connect Hub ready on port ${port} (${dev ? "development" : "production"})`);
  });
  const shutdown = () => {
    setTimeout(() => process.exit(0), 10000).unref();
    httpServer.io.close(() => {
      db.$disconnect().finally(() => process.exit(0));
    });
  };
  process.once("SIGTERM", shutdown);
  process.once("SIGINT", shutdown);
}).catch((error) => {
  console.error(error);
  process.exit(1);
});
