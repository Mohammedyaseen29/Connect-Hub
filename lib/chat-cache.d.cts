import type { InfiniteData } from "@tanstack/react-query";
import type { Member, Message, Profile } from "@prisma/client";
export type ChatMessage = Message & { member: Member & { profile: Profile } };
export type ChatPage = { items: ChatMessage[]; nextCursor: string | null };
export type ChatData = InfiniteData<ChatPage, string | undefined>;
export function upsertMessage(data: ChatData | undefined, message: ChatMessage, insert?: boolean): ChatData | undefined;
export function reconcileMessages(data: ChatData | undefined, latest: ChatPage): ChatData | undefined;
