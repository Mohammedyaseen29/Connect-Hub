const { Server } = require("socket.io");

function validChat(chat) {
  return chat && ["channel", "conversation"].includes(chat.type) &&
    typeof chat.id === "string" && chat.id.length > 0 && chat.id.length <= 128;
}

function chatRoom(chat, profileId) {
  return `chat:${chat.type}:${chat.id}:profile:${profileId}`;
}

async function canAccessChat(db, profileId, chat) {
  if (!validChat(chat)) return false;
  if (chat.type === "channel") {
    return !!await db.channel.findFirst({
      where: { id: chat.id, server: { member: { some: { profileId } } } },
      select: { id: true },
    });
  }
  return !!await db.conversation.findFirst({
    where: { id: chat.id, OR: [{ memberOne: { profileId } }, { memberTwo: { profileId } }] },
    select: { id: true },
  });
}

function sameOrigin(request) {
  const origin = request.headers.origin;
  if (!origin) return request.headers["sec-fetch-site"] === "same-origin";
  try {
    const host = request.headers["x-forwarded-host"] || request.headers.host;
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

function createRealtimeServer(httpServer, { db, verifyToken }) {
  const io = new Server(httpServer, {
    path: "/api/socket/io",
    allowRequest: (request, done) => done(null, sameOrigin(request)),
    maxHttpBufferSize: 16384,
  });
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (typeof token !== "string" || token.length > 8192) throw new Error("Invalid token");
      const claims = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY,
        authorizedParties: [socket.handshake.headers.origin ||
          ((socket.handshake.headers["x-forwarded-proto"] || (socket.request.socket.encrypted ? "https" : "http")) +
           "://" + (socket.handshake.headers["x-forwarded-host"] || socket.handshake.headers.host))],
      });
      if (typeof claims.sub !== "string" || !Number.isFinite(claims.exp) || claims.exp * 1000 <= Date.now()) throw new Error("Expired token");
      const profile = await db.profile.findUnique({ where: { userId: claims.sub }, select: { id: true } });
      if (!profile) throw new Error("Profile not found");
      socket.data.profileId = profile.id;
      socket.data.expiresAt = claims.exp * 1000;
      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });
  io.on("connection", (socket) => {
    const expiry = setTimeout(() => socket.disconnect(true), Math.max(0, socket.data.expiresAt - Date.now()));
    socket.on("disconnect", () => clearTimeout(expiry));
    let subscriptionVersion = 0;
    let pendingChat;
    let subscriptions = [];
    socket.on("chat:subscribe", async (chat, acknowledge) => {
      if (typeof acknowledge !== "function") return;
      subscriptions = subscriptions.filter((time) => time > Date.now() - 10000);
      if (subscriptions.length >= 20) return acknowledge({ ok: false });
      subscriptions.push(Date.now());
      const version = ++subscriptionVersion;
      pendingChat = validChat(chat) ? chatRoom(chat, socket.data.profileId) : undefined;
      try {
        if (socket.data.expiresAt <= Date.now() || !await canAccessChat(db, socket.data.profileId, chat)) {
          return acknowledge({ ok: false });
        }
        if (version !== subscriptionVersion || !socket.connected) return acknowledge({ ok: false });
        for (const room of socket.rooms) {
          if (room !== socket.id) await socket.leave(room);
        }
        if (version !== subscriptionVersion || !socket.connected) return acknowledge({ ok: false });
        await socket.join(chatRoom(chat, socket.data.profileId));
        acknowledge({ ok: true });
      } catch {
        acknowledge({ ok: false });
      }
    });
    socket.on("chat:unsubscribe", (chat) => {
      if (!validChat(chat)) return;
      const room = chatRoom(chat, socket.data.profileId);
      if (pendingChat === room) { ++subscriptionVersion; pendingChat = undefined; }
      socket.leave(room);
    });
  });
  return io;
}

function broadcastChatMessage(io, chat, message, profileIds, update = false) {
  if (!io || !validChat(chat) || !profileIds.length) return;
  io.to([...new Set(profileIds)].map((id) => chatRoom(chat, id)))
    .emit(`chat:${chat.id}:messages${update ? ":update" : ""}`, message);
}

async function publishChatMessage(io, db, chat, message, update = false) {
  if (!io) return;
  try {
    let profileIds;
    if (chat.type === "channel") {
      const channel = await db.channel.findUnique({
        where: { id: chat.id },
        select: { server: { select: { member: { select: { profileId: true } } } } },
      });
      profileIds = channel?.server.member.map((member) => member.profileId) || [];
    } else {
      const conversation = await db.conversation.findUnique({
        where: { id: chat.id },
        select: { memberOne: { select: { profileId: true } }, memberTwo: { select: { profileId: true } } },
      });
      profileIds = conversation ? [conversation.memberOne.profileId, conversation.memberTwo.profileId] : [];
    }
    // Resolve membership again so revoked members receive no further messages.
    if (profileIds.length) {
      io.to(profileIds.map((id) => chatRoom(chat, id)))
        .emit(`chat:${chat.id}:messages${update ? ":update" : ""}`, message);
    }
  } catch (error) {
    // The write succeeded; uncached reconciliation will recover missed events.
    console.error("[CHAT_PUBLISH]", error);
  }
}

module.exports = { canAccessChat, chatRoom, createRealtimeServer, publishChatMessage, broadcastChatMessage, sameOrigin };
