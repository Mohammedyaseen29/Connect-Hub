import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentProfile } from "@/lib/current-profile";
import { canAccessChat } from "@/lib/chat-realtime.cjs";
import { chatIdSchema } from "@/lib/message-validation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
    try {
        const profile = await currentProfile();
        if (!profile) return new NextResponse("Unauthorized", { status: 401 });
        const { searchParams } = new URL(req.url);
        const chatId = chatIdSchema.safeParse(searchParams.get("channelId"));
        const cursor = searchParams.get("cursor");
        if (!chatId.success || (cursor !== null && !chatIdSchema.safeParse(cursor).success)) {
            return new NextResponse("Invalid chat or cursor", { status: 400 });
        }
        if (!await canAccessChat(db, profile.id, { type: "channel", id: chatId.data })) {
            return new NextResponse("Chat not found", { status: 404 });
        }
        const where = { channelId: chatId.data };
        if (cursor && !await db.message.findFirst({ where: { ...where, id: cursor }, select: { id: true } })) {
            return new NextResponse("Invalid cursor", { status: 400 });
        }
        const batch = 50;
        const messages = await db.message.findMany({
            take: batch,
            ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
            where,
            include: { member: { include: { profile: true } } },
            orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        });
        return NextResponse.json({
            items: messages,
            nextCursor: messages.length === batch ? messages[batch - 1].id : null,
        }, { headers: { "Cache-Control": "private, no-store, max-age=0", "Vary": "Cookie, Authorization" } });
    } catch (error) {
        console.error("[MESSAGES_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
