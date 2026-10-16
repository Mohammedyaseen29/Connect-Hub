import { NextApiRequest } from "next";
import { NextApiResponseServerio } from "@/type";
import { currentPagesUserId } from "@/lib/current-pagesprofile";
import { chatIdSchema, messageCreateSchema } from "@/lib/message-validation";
import { createChatMessage } from "@/lib/create-chat-message";
import { broadcastChatMessage } from "@/lib/chat-realtime.cjs";

export default async function handler(req: NextApiRequest, res: NextApiResponseServerio) {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
    try {
        const userId = await currentPagesUserId(req);
        if (!userId) return res.status(401).json({ error: "Unauthorized" });
        const body = messageCreateSchema.safeParse(req.body);
        const chatId = chatIdSchema.safeParse(req.query.channelId);
        const serverId = chatIdSchema.safeParse(req.query.serverId);
        if (!body.success || !chatId.success || !serverId.success) {
            return res.status(400).json({ error: "Invalid message or chat" });
        }
        const start = performance.now();
        const created = await createChatMessage({ userId, type: "channel", chatId: chatId.data, serverId: serverId.data, ...body.data });
        if (!created) return res.status(404).json({ error: "Chat not found" });
        res.setHeader("Server-Timing", "db;dur=" + (performance.now() - start).toFixed(1));
        broadcastChatMessage(res.socket?.server?.io, { type: "channel", id: chatId.data }, created.message, created.recipientProfileIds);
        res.setHeader("Cache-Control", "private, no-store");
        return res.status(200).json(created.message);
    } catch (error) {
        console.error("[CHANNEL_MESSAGE_POST]", error);
        return res.status(500).json({ error: "Internal Error" });
    }
}
