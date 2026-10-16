import { AccessToken } from "livekit-server-sdk";
import { NextRequest, NextResponse } from "next/server";
import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";
import { canAccessChat } from "@/lib/chat-realtime.cjs";
import { chatIdSchema } from "@/lib/message-validation";

export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
    try {
        const profile = await currentProfile();
        if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const room = chatIdSchema.safeParse(req.nextUrl.searchParams.get("room"));
        if (!room.success) return NextResponse.json({ error: "Invalid room" }, { status: 400 });
        const channel = await db.channel.findFirst({
            where: { id: room.data, type: { in: ["AUDIO", "VIDEO"] }, server: { member: { some: { profileId: profile.id } } } },
            select: { id: true },
        });
        if (!channel && !await canAccessChat(db, profile.id, { type: "conversation", id: room.data })) {
            return NextResponse.json({ error: "Room not found" }, { status: 404 });
        }
        const apiKey = process.env.LIVEKIT_API_KEY;
        const apiSecret = process.env.LIVEKIT_API_SECRET;
        if (!apiKey || !apiSecret || !process.env.NEXT_PUBLIC_LIVEKIT_URL) {
            return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
        }
        // Derive identity from authentication; callers cannot impersonate another user.
        const token = new AccessToken(apiKey, apiSecret, { identity: profile.userId, name: profile.name, ttl: "10m" });
        token.addGrant({ room: room.data, roomJoin: true, canPublish: true, canSubscribe: true });
        return NextResponse.json({ token: await token.toJwt() }, { headers: { "Cache-Control": "private, no-store" } });
    } catch (error) {
        console.error("[LIVEKIT_TOKEN]", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
