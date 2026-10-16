"use client"
import { useEffect,useState } from "react"
import {LiveKitRoom,VideoConference} from "@livekit/components-react";
import "@livekit/components-styles";
import { Channel } from "@prisma/client";
import { useUser } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";


interface MediaRoomProps{
    chatId:string,
    video:boolean,
    audio:boolean,
}

export const MediaRoom = ({chatId,video,audio}:MediaRoomProps)=>{
    const {user} = useUser();
    const [token,setToken] = useState("");
    useEffect(()=>{
        if(!user?.id) return;
        let active = true;
        setToken("");



        (async ()=>{
            try{
                const res = await fetch(`/api/livekit?room=${encodeURIComponent(chatId)}`, { cache: "no-store" });
                if (!res.ok) throw new Error("Unable to join room");
                const data = await res.json();
                if (active) setToken(data.token);
            }catch(e){
                console.log(e);
            }
        })();

        return () => { active = false; };
    },[user?.id,chatId]);
    if(token === ""){
        return(
            <div className="flex flex-col flex-1 items-center justify-center">
                <Loader2 className="h-7 w-7 text-zinc-500 animate-spin my-4"/>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Establishing Connection....</p>
            </div>
        )
    }
    return(
        <LiveKitRoom data-lk-theme="default" serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL} token={token} connect={true} video={video} audio={audio}>
            <VideoConference />
        </LiveKitRoom>
    )
}