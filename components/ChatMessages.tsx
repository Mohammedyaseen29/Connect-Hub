"use client";

import { Member, Message, Profile } from "@prisma/client";
import ChatWelcome from "./ChatWelcome";
import { useChatQuery } from "@/Hooks/use-chat-query";
import {Loader2, SatelliteDish, ServerCrash } from "lucide-react";
import { Fragment,useRef,ElementRef } from "react";
import { format } from "date-fns";
import { ChatItem } from "./chat/ChatItem";
import { useChatSocket } from "@/Hooks/use-chat-socket";
import { useChatScroll } from "@/Hooks/use-chat-scroll";
type MessageWithMemberProfile = Message & {
    member:Member & {
        profile:Profile
    }
}
interface ChatMessagesProps{
    name:string;
    member:Member;
    chatId:string;
    apiUrl:string;
    socketUrl:string;
    socketQuery:Record<string,string>;
    paramKey:"channelId" | "conversationId";
    paramValue:string;
    type:"channel" | "conversation";

}

    

export const ChatMessages = ({name,member,chatId,apiUrl,socketUrl,socketQuery,paramKey,paramValue,type}:ChatMessagesProps) => {
    const queryKey = `chat:${chatId}`;
    const addKey = `chat:${chatId}:messages`;
    const updateKey = `chat:${chatId}:messages:update`
    const {data,fetchNextPage,hasNextPage,isFetchingNextPage,status} = useChatQuery({queryKey,apiUrl,paramKey,paramValue});
    const chatRef = useRef<ElementRef<"div">>(null);
    const bottomRef = useRef<ElementRef<"div">>(null);
    useChatSocket({queryKey,addKey,updateKey})
    useChatScroll({chatRef,bottomRef,loadMore:fetchNextPage,shouldLoadMore: !isFetchingNextPage && !!hasNextPage, count:data?.pages?.[0]?.items?.length ?? 0,})
    

    if(status === "pending"){
        return (
            <div className="flex flex-1 flex-col items-center justify-center gap-y-1">
                <SatelliteDish className="animate-bounce text-zinc-500 w-7 h-7"/>
                <p className="text-xs capitalize text-zinc-500 dark:text-zinc-400">Assembling the Experience...</p>
            </div>
        )
    }
    if(status === "error"){
        return (
            <div className="flex flex-1 flex-col items-center justify-center gap-y-1">
                <ServerCrash className="text-zinc-500 w-7 h-7"/>
                <p className="text-xs capitalize text-zinc-500 dark:text-zinc-400 ">Oops somethings went wrong!.</p>
            </div>
        )
    }

    return (
        <div ref={chatRef} className="flex-1 flex flex-col overflow-y-auto py-4">
            {!hasNextPage && (<div className="flex-1"/>)}
            {!hasNextPage && (<ChatWelcome name={name} type={type}/>)}
            {hasNextPage && (<div className="flex justify-center">
                {isFetchingNextPage ? (<Loader2 className="animate-spin w-4 h-4 my-4"/>): (<button onClick={()=>fetchNextPage()} className="text-zinc-500 hover:text-zinc-600 dark:text-zinc-400 text-xs my-4 dark:hover:text-zinc-300 transition">Load Previous messages</button>)}
            </div>)}
            <div className="flex flex-col-reverse mt-auto">
                {data?.pages?.map((grp,i)=>(
                    <Fragment key={i}>
                        {grp.items.map((message:MessageWithMemberProfile)=>(
                            <ChatItem key={message.id} id={message.id} currentMember={member} content={message.content} fileUrl={message.fileUrl} deleted={message.deleted} timeStamp={format(new Date(message.createdAt),"d MMM yyyy,HH:mm")} isUpdated={message.updatedAt !== message.createdAt} socketUrl={socketUrl} socketQuery={socketQuery} member={message.member}/>
                        ))}
                    </Fragment>
                ))}
            </div>
            <div ref={bottomRef}/>
        </div>
    )
}
