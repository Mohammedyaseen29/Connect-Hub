import type { PrismaClient } from "@prisma/client";
import type { Server } from "socket.io";
export type Chat = { type: "channel" | "conversation"; id: string };
export function canAccessChat(db: PrismaClient, profileId: string, chat: Chat): Promise<boolean>;
export function publishChatMessage(io: Server | undefined, db: PrismaClient, chat: Chat, message: unknown, update?: boolean): Promise<void>;

export function broadcastChatMessage(io: Server | undefined, chat: Chat, message: unknown, profileIds: string[], update?: boolean): void;
