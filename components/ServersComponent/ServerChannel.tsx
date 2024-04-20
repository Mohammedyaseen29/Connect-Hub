"use client"
import { cn } from '@/lib/utils'
import { Channel, ChannelType, MemberRole, Server } from '@prisma/client'
import { Edit, Lock, Mic, Trash, Video, MessagesSquare } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import React from 'react'
import ActionTooltip from '../actionTooltip'
import { useModal } from '@/Hooks/use-modal-hook'
import { ModalType } from '@/Hooks/use-modal-hook'
interface ServerChannelProps{
    role:MemberRole | undefined,
    server:Server,
    channel:Channel
}
const iconMap ={
    [ChannelType.TEXT]:MessagesSquare,
    [ChannelType.AUDIO]:Mic,
    [ChannelType.VIDEO]:Video
}

const ServerChannel = ({role,server,channel}:ServerChannelProps) => {
    const Icon =iconMap[channel.type as keyof typeof iconMap]
    const params = useParams();
    const router = useRouter();
    const {onOpen} = useModal();

    const onclick = ()=>{
        router.push(`/servers/${params?.serverId}/channels/${channel.id}`);
    }
    const onAction = (e:React.MouseEvent,action:ModalType)=>{
        e.stopPropagation();
        onOpen(action,{channel,server})

    }

    return (
        <button onClick={()=>onclick()} className={cn('group hover:bg-zinc-700/10 hover:dark:bg-zinc-700/50 w-full flex items-center p-2 rounded-md mb-1 transition',params?.channelId === channel.id && "bg-zinc-700/20 dark:bg-zinc-700")}>
            <Icon className='flex-shrink-0 w-5 h-5 mr-2 text-zinc-500 dark:text-zinc-400'/>
            <p className={cn('line-clamp-1 text-sm font-semibold text-zinc-500 dark:text-zinc-400 hover:text-zinc-600 hover:dark:text-zinc-300',params?.channelId === channel.id && "text-primary dark:text-zinc-200 dark:group-hover:text-white")}>{channel.name}</p>
            {channel.name !== "general" && role !== MemberRole.GUEST &&(
                <div className='ml-auto flex items-center gap-x-2'>
                    <ActionTooltip label='Edit' side='top'>
                        <Edit onClick={(e)=>onAction(e,"EditChannel")} className='hidden group-hover:block w-4 h-4 text-zinc-500 dark:text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'/>
                    </ActionTooltip>
                    <ActionTooltip label='Delete' side='top'>
                        <Trash onClick={(e)=>onAction(e,"deleteChannel")} className='hidden group-hover:block w-4 h-4 text-zinc-500 dark:text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'/>
                    </ActionTooltip>
                </div>
            )}
            {channel.name === "general" &&(
                <div className='ml-auto'>
                    <Lock className='w-4 h-4 text-zinc-500 dark:text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'/>
                </div>
            )}
        </button>
    )
}

export default ServerChannel