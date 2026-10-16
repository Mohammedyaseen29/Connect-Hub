import { NextApiRequest } from "next";
import { NextApiResponseServerio } from "@/type";
import { currentPagesProfile } from "@/lib/current-pagesprofile";
import { db } from "@/lib/db";
import { chatIdSchema, messageContentSchema } from "@/lib/message-validation";
import { publishChatMessage } from "@/lib/chat-realtime.cjs";

export default async function handler(req: NextApiRequest, res: NextApiResponseServerio) {
    if (req.method !== "DELETE" && req.method !== "PATCH") return res.status(405).json({ error: "Method not allowed" });
    try {
        const profile = await currentPagesProfile(req);
        if (!profile) return res.status(401).json({ error: "Unauthorized" });
        const chatId = chatIdSchema.safeParse(req.query.channelId);
        const messageId = chatIdSchema.safeParse(req.query.messageId);
        const serverId = chatIdSchema.safeParse(req.query.serverId);
        const body = req.method === "PATCH" ? messageContentSchema.safeParse(req.body) : undefined;
        if (!chatId.success || !messageId.success || !serverId.success || (body && !body.success)) {
            return res.status(400).json({ error: "Invalid message or chat" });
        }
        const member = await db.member.findFirst({
            where: { profileId: profile.id, serverId: serverId.data, server: { channel: { some: { id: chatId.data } } } },
            select: { id: true, role: true },
        });
        if (!member) return res.status(404).json({ error: "Chat not found" });
        const existing = await db.message.findFirst({
            where: { id: messageId.data, channelId: chatId.data, deleted: false },
        });
        if (!existing) return res.status(404).json({ error: "Message not found" });
        const isOwner = existing.memberId === member.id;
        const canDelete = isOwner || member.role === "ADMIN" || member.role === "MODERATOR";
        if ((req.method === "DELETE" && !canDelete) || (req.method === "PATCH" && !isOwner)) {
            return res.status(403).json({ error: "Forbidden" });
        }
        const message = await db.message.update({
            where: { id: messageId.data },
            data: req.method === "DELETE"
                ? { fileUrl: null, content: "This message has gone incognito. Deleted!", deleted: true }
                : { content: body?.success ? body.data.content : existing.content },
            include: { member: { include: { profile: true } } },
        });
        await publishChatMessage(res.socket?.server?.io, db, { type: "channel", id: chatId.data }, message, true);
        res.setHeader("Cache-Control", "private, no-store");
        return res.status(200).json(message);
    } catch (error) {
        console.error("[MESSAGE_UPDATE]", error);
        return res.status(500).json({ error: "Internal Error" });
    }
}
