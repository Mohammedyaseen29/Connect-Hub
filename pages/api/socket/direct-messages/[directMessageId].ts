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
        const chatId = chatIdSchema.safeParse(req.query.conversationId);
        const messageId = chatIdSchema.safeParse(req.query.directMessageId);
        
        const body = req.method === "PATCH" ? messageContentSchema.safeParse(req.body) : undefined;
        if (!chatId.success || !messageId.success || (body && !body.success)) {
            return res.status(400).json({ error: "Invalid message or chat" });
        }
        const conversation = await db.conversation.findFirst({
            where: { id: chatId.data, OR: [{ memberOne: { profileId: profile.id } }, { memberTwo: { profileId: profile.id } }] },
            select: { memberOne: { select: { id: true, profileId: true } }, memberTwo: { select: { id: true, profileId: true } } },
        });
        if (!conversation) return res.status(404).json({ error: "Chat not found" });
        const member = conversation.memberOne.profileId === profile.id ? conversation.memberOne : conversation.memberTwo;
        const existing = await db.directMessage.findFirst({
            where: { id: messageId.data, conversationId: chatId.data, deleted: false },
        });
        if (!existing) return res.status(404).json({ error: "Message not found" });
        const isOwner = existing.memberId === member.id;
        const canDelete = isOwner;
        if ((req.method === "DELETE" && !canDelete) || (req.method === "PATCH" && !isOwner)) {
            return res.status(403).json({ error: "Forbidden" });
        }
        const message = await db.directMessage.update({
            where: { id: messageId.data },
            data: req.method === "DELETE"
                ? { fileUrl: null, content: "This message has gone incognito. Deleted!", deleted: true }
                : { content: body?.success ? body.data.content : existing.content },
            include: { member: { include: { profile: true } } },
        });
        await publishChatMessage(res.socket?.server?.io, db, { type: "conversation", id: chatId.data }, message, true);
        res.setHeader("Cache-Control", "private, no-store");
        return res.status(200).json(message);
    } catch (error) {
        console.error("[DIRECTMESSAGE_UPDATE]", error);
        return res.status(500).json({ error: "Internal Error" });
    }
}
