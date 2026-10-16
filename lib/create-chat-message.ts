import { randomUUID } from "node:crypto";
import { Prisma, Message, Member, Profile } from "@prisma/client";
import { db } from "@/lib/db";

type SendMessage = {
    userId: string;
    type: "channel" | "conversation";
    chatId: string;
    serverId?: string;
    content: string;
    fileUrl?: string | null;
};
type CreatedRow = Message & {
    member: Member & { profile: Profile };
    recipientProfileIds: string[];
};

export async function createChatMessage(input: SendMessage) {
    const { userId, type, chatId, serverId, content, fileUrl } = input;
    const id = randomUUID();
    // Authorization, insertion, related display data, and allowed recipients share
    // one database snapshot and one network round trip. Values remain parameters.
    const memberPayload = Prisma.sql`to_jsonb(sender) || jsonb_build_object('profile', to_jsonb(profile))`;
    const authorized = type === "channel" ? Prisma.sql`
        SELECT sender."id" AS "memberId", ${memberPayload} AS "memberPayload",
            ARRAY(SELECT recipient."profileId" FROM "Member" recipient
                  WHERE recipient."serverId" = ${serverId}) AS "recipientProfileIds"
        FROM "Profile" profile
        JOIN "Member" sender ON sender."profileId" = profile."id"
        JOIN "Channel" channel ON channel."serverId" = sender."serverId"
        WHERE profile."userId" = ${userId} AND sender."serverId" = ${serverId}
          AND channel."id" = ${chatId} AND channel."type" = 'TEXT'
        LIMIT 1
    ` : Prisma.sql`
        SELECT sender."id" AS "memberId", ${memberPayload} AS "memberPayload",
            ARRAY[member_one."profileId", member_two."profileId"] AS "recipientProfileIds"
        FROM "Conversation" conversation
        JOIN "Member" member_one ON member_one."id" = conversation."memberOneId"
        JOIN "Member" member_two ON member_two."id" = conversation."membertwoId"
        JOIN "Member" sender ON sender."id" = member_one."id" OR sender."id" = member_two."id"
        JOIN "Profile" profile ON profile."id" = sender."profileId"
        WHERE conversation."id" = ${chatId} AND profile."userId" = ${userId}
        LIMIT 1
    `;
    const insertion = type === "channel" ? Prisma.sql`
        INSERT INTO "Message" ("id", "content", "fileUrl", "memberId", "channelId", "createdAt", "updatedAt", "deleted")
        SELECT ${id}, ${content}, ${fileUrl ?? null}, "memberId", ${chatId},
            (now() AT TIME ZONE 'UTC'), (now() AT TIME ZONE 'UTC'), false
        FROM authorized RETURNING *
    ` : Prisma.sql`
        INSERT INTO "DirectMessage" ("id", "content", "fileUrl", "memberId", "conversationId", "createdAt", "updatedAt", "deleted")
        SELECT ${id}, ${content}, ${fileUrl ?? null}, "memberId", ${chatId},
            (now() AT TIME ZONE 'UTC'), (now() AT TIME ZONE 'UTC'), false
        FROM authorized RETURNING *
    `;
    const rows = await db.$queryRaw<CreatedRow[]>(Prisma.sql`
        WITH authorized AS (${authorized}), inserted AS (${insertion})
        SELECT inserted.*, authorized."memberPayload" AS "member", authorized."recipientProfileIds"
        FROM inserted JOIN authorized ON inserted."memberId" = authorized."memberId"
    `);
    if (!rows.length) return null;
    const { recipientProfileIds, ...message } = rows[0];
    // PostgreSQL JSON timestamps lack a timezone; preserve the existing API's UTC contract.
    const date = (value: Date) => typeof value === "string"
        ? new Date(/[zZ]|[+-]\d{2}:\d{2}$/.test(value) ? value : value + "Z") : value;
    message.member.createdAt = date(message.member.createdAt);
    message.member.updatedAt = date(message.member.updatedAt);
    message.member.profile.createdAt = date(message.member.profile.createdAt);
    message.member.profile.updatedAt = date(message.member.profile.updatedAt);
    return { message, recipientProfileIds };
}
