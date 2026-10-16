import qs from "@/lib/query-url";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useSocket } from "@/components/Provider/socketProvider";
import { ChatData, ChatPage, reconcileMessages } from "@/lib/chat-cache.cjs";

interface ChatQueryProps {
    queryKey: string; apiUrl: string;
    paramKey: "channelId" | "conversationId"; paramValue: string;
    isSubscribed: boolean;
}

export const useChatQuery = ({ queryKey, apiUrl, paramKey, paramValue, isSubscribed }: ChatQueryProps) => {
    const { isConnected } = useSocket();
    const queryClient = useQueryClient();
    const fetchMessages = async (cursor: string | undefined, signal?: AbortSignal): Promise<ChatPage> => {
        const url = qs.stringifyUrl({ url: apiUrl, query: { cursor, [paramKey]: paramValue } });
        const response = await fetch(url, { cache: "no-store", signal });
        if (!response.ok) throw new Error("Unable to load messages (" + response.status + ")");
        return response.json();
    };
    const query = useInfiniteQuery({
        queryKey: [queryKey],
        queryFn: ({ pageParam, signal }) => fetchMessages(pageParam, signal),
        getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
        initialPageParam: undefined as string | undefined,
        retry: 1,
    });
    // Poll just the newest page, regardless of how much history has been loaded.
    const latest = useQuery({
        queryKey: [queryKey, "latest"],
        queryFn: ({ signal }) => fetchMessages(undefined, signal),
        enabled: query.status === "success",
        refetchInterval: isConnected && isSubscribed ? 10000 : 1000,
        refetchOnWindowFocus: "always",
        retry: 1,
    });
    useEffect(() => {
        if (latest.data) queryClient.setQueryData<ChatData>([queryKey], (data) => reconcileMessages(data, latest.data));
    }, [latest.data, latest.dataUpdatedAt, queryClient, queryKey]);
    return query;
};
