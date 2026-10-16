import { useSocket } from "@/components/Provider/socketProvider";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ChatMessage, ChatData, upsertMessage } from "@/lib/chat-cache.cjs";

type ChatSocketProps = {
    addKey: string; updateKey: string; queryKey: string;
    chatId: string; type: "channel" | "conversation";
};

export const useChatSocket = ({ addKey, updateKey, queryKey, chatId, type }: ChatSocketProps) => {
    const { socket } = useSocket();
    const queryClient = useQueryClient();
    const [isSubscribed, setSubscribed] = useState(false);

    useEffect(() => {
        setSubscribed(false);
        if (!socket) return;
        let active = true;
        const chat = { id: chatId, type };
        const receive = (message: ChatMessage) => {
            queryClient.setQueryData<ChatData>([queryKey], (data) => upsertMessage(data, message));
        };
        const update = (message: ChatMessage) => {
            queryClient.setQueryData<ChatData>([queryKey], (data) => upsertMessage(data, message, false));
        };
        const subscribe = () => {
            setSubscribed(false);
            socket.timeout(5000).emit("chat:subscribe", chat, (error: Error | null, reply: { ok?: boolean }) => {
                if (!active) return;
                setSubscribed(!error && reply?.ok === true);
                // Recover messages between the initial fetch and room join, or during disconnection.
                void queryClient.invalidateQueries({ queryKey: [queryKey] });
            });
        };
        const disconnect = () => setSubscribed(false);
        socket.on(addKey, receive);
        socket.on(updateKey, update);
        socket.on("connect", subscribe);
        socket.on("disconnect", disconnect);
        if (socket.connected) subscribe();
        return () => {
            active = false;
            socket.off(addKey, receive);
            socket.off(updateKey, update);
            socket.off("connect", subscribe);
            socket.off("disconnect", disconnect);
            if (socket.connected) socket.emit("chat:unsubscribe", chat);
        };
    }, [socket, addKey, updateKey, queryKey, queryClient, chatId, type]);
    return { isSubscribed };
};
