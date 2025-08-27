import { useSocket } from '@/components/Provider/socketProvider';
import { Member, Message, Profile } from "@prisma/client";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

type ChatSocketProps = {
    addKey: string;
    updateKey: string;
    queryKey: string;
}

type MessageWithMemberProfile = Message & {
    member: Member & {
        profile: Profile;
    }
}

export const useChatSocket = ({ addKey, updateKey, queryKey }: ChatSocketProps) => {
    const { socket } = useSocket();
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!socket) {
            return;
        }

        // Handle new messages
        const handleNewMessage = (message: MessageWithMemberProfile) => {
            console.log("New message received:", message);

            queryClient.setQueryData([queryKey], (oldData: any) => {
                if (!oldData || !oldData.pages || oldData.pages.length === 0) {
                    return {
                        pages: [{
                            items: [message],
                            nextCursor: null
                        }]
                    };
                }

                const newData = [...oldData.pages];
                newData[0] = {
                    ...newData[0],
                    items: [message, ...newData[0].items]
                };

                return {
                    ...oldData,
                    pages: newData
                };
            });
        };

        // Handle message updates
        const handleUpdateMessage = (message: MessageWithMemberProfile) => {
            console.log("Message updated:", message);

            queryClient.setQueryData([queryKey], (oldData: any) => {
                if (!oldData || !oldData.pages || oldData.pages.length === 0) {
                    return oldData;
                }

                const newData = oldData.pages.map((page: any) => {
                    return {
                        ...page,
                        items: page.items.map((item: MessageWithMemberProfile) => {
                            if (item.id === message.id) {
                                return message;
                            }
                            return item;
                        })
                    };
                });

                return {
                    ...oldData,
                    pages: newData
                };
            });
        };

        // Register event listeners
        socket.on(addKey, handleNewMessage);
        socket.on(updateKey, handleUpdateMessage);

        // Cleanup listeners
        return () => {
            socket.off(addKey, handleNewMessage);
            socket.off(updateKey, handleUpdateMessage);
        };
    }, [socket, addKey, updateKey, queryKey, queryClient]);
}