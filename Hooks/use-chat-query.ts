import qs from "query-string";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useSocket } from "@/components/Provider/socketProvider";

interface useChatQueryProps{
    queryKey:string;
    apiUrl:string;
    paramKey:"channelId" | "conversationId";
    paramValue:string;
}

export const useChatQuery = ({queryKey,apiUrl,paramKey,paramValue}:useChatQueryProps)=>{
    const {isConnected} = useSocket();
    const fetchMessages = async({pageParam = undefined})=>{
        const url = qs.stringifyUrl({
            url : apiUrl,
            query:{
                cursor:pageParam,
                [paramKey]:paramValue,
            }
        })
        const result = await fetch(url);
        return result.json();
    }
    const {data,fetchNextPage,hasNextPage,isFetchingNextPage,status} = useInfiniteQuery({
        queryKey: [queryKey],
        queryFn: fetchMessages,
        getNextPageParam: (lastPage)=>lastPage?.nextCursor,
        refetchInterval: isConnected ? false : 1000,
        initialPageParam:undefined, 
    });
    return {
        data,fetchNextPage,hasNextPage,isFetchingNextPage,status,
    };
}

