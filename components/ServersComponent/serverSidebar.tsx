import React from 'react'
import { db } from '@/lib/db';
import {MessagesSquare, Mic, ShieldAlert, ShieldCheck, Video } from "lucide-react";
import { currentProfile } from '@/lib/current-profile';
import { redirectToSignIn } from '@clerk/nextjs';
import { ChannelType } from '@prisma/client';
import { redirect } from 'next/navigation';
import ServerHeader from './ServerHeader';
import { ScrollArea } from "../ui/scroll-area";
import ServerSearch from "./ServerSearch";
import { MemberRole } from '@prisma/client';
import { Separator } from '../ui/separator';
import ServerSection from './ServerSection';
import ServerChannel from './ServerChannel';
import ServerMember from './ServerMember';

interface ServerSidebarProps{
    serverId:string;
}

const ServerSidebar = async({serverId}:ServerSidebarProps) => {
    const profile = await currentProfile();
    if(!profile){
        return redirectToSignIn();
    }
    const server = await db.server.findUnique({
        where:{
            id:serverId,
        },
        include:{
            channel:{
                orderBy:{
                    createdAt:"asc",
                }
            },
            member:{
                include:{
                    profile:true,
                },
                orderBy:{
                    role: "asc",
                }
            }
        }
    })
    const TextChannel = server?.channel.filter((channel:any)=>channel.type === ChannelType.TEXT);
    const AudioChannel = server?.channel.filter((channel:any)=>channel.type === ChannelType.AUDIO);
    const VideoChannel = server?.channel.filter((channel:any)=>channel.type === ChannelType.VIDEO);
    const members = server?.member.filter((member:any)=>member.profileId !== profile.id)
    if(!server){
        return redirect("/")
    }
    const role = server.member.find((member:any)=>member.profileId === profile.id)?.role
    const iconMap = {
        [ChannelType.TEXT]:<MessagesSquare className="mr-2 w-4 h-4"/>,
        [ChannelType.AUDIO]:<Mic className="mr-2 w-4 h-4"/>,
        [ChannelType.VIDEO]:<Video className="mr-2 w-4 h-4"/>
    }
    const roleIconMap = {
        [MemberRole.GUEST]:null,
        [MemberRole.MODERATOR]:<ShieldCheck className="text-green-500 mr-2 w-4 h-4"/>,
        [MemberRole.ADMIN]:<ShieldAlert className="text-rose-500 mr-2 w-4 h-4"/>
    }
    return (
        <div className='flex flex-col h-full text-primary w-full dark:bg-[#2B2D31] bg-[#F2F3F5]'>
            <ServerHeader server={server} role={role}/>
            <ScrollArea className="flex-1 px-3">
                <div className="mt-2">
                    <ServerSearch data={[
                    {
                        label:"Text Streamlines",
                        type:"channel",
                        data: TextChannel?.map((channel:any)=>({
                            id:channel.id,
                            name:channel.name,
                            icon:iconMap[channel.type as keyof typeof iconMap]
                        }))
                    },
                    {
                        label:"Voice Streamlines",
                        type:"channel",
                        data: AudioChannel?.map((channel:any)=>({
                            id:channel.id,
                            name:channel.name,
                            icon:iconMap[channel.type as keyof typeof iconMap]
                        }))
                    },
                    {
                        label:"Video Streamlines",
                        type:"channel",
                        data: VideoChannel?.map((channel:any)=>({
                            id:channel.id,
                            name:channel.name,
                            icon:iconMap[channel.type as keyof typeof iconMap]
                        }))
                    },
                    {
                        label:"Members",
                        type:"member",
                        data: members?.map((member:any)=>({
                            id:member.id,
                            name:member.profile.name,
                            icon:roleIconMap[member.role as keyof typeof roleIconMap]
                        }))
                    },

                    ]}/>
                </div>
                <Separator className='bg-zinc-200 my-2 dark:bg-zinc-700 rounded'/>
                {!!TextChannel?.length && (
                <div className='mb-4'>
                    <ServerSection sectionType="channel" channelType={ChannelType.TEXT} role={role} label="Text Streamlines" server={server}/>
                    <div className='space-y-[2px]'>
                        {TextChannel?.map((channel:any) => (
                            <ServerChannel key={channel.id} server={server} channel={channel} role={role} />
                        ))}
                    </div>
                </div>
                )}
                {!!AudioChannel?.length && (
                <div className='mb-4'>
                    <ServerSection sectionType="channel" channelType={ChannelType.AUDIO} role={role} label="Audio Streamlines" server={server}/>
                    <div className='space-y-[2px]'>
                        {AudioChannel?.map((channel:any) => (
                            <ServerChannel key={channel.id} server={server} channel={channel} role={role} />
                        ))}
                    </div>    
                </div>
                )}
                {!!VideoChannel?.length && (
                <div className='mb-4'>
                    <ServerSection sectionType="channel" channelType={ChannelType.VIDEO} role={role} label="Video Streamlines" server={server}/>
                    <div className='space-y-[2px]'>
                    {VideoChannel?.map((channel:any) => (
                        <ServerChannel key={channel.id} server={server} channel={channel} role={role} />
                    ))}
                    </div>
                </div>
                )}
                {!!members?.length && (
                    <div className='mb-4'>
                        <ServerSection sectionType='member' role={role} label='Members' server={server}/>
                        <div className='space-y-[2px]'>
                        {members.map((member:any)=>(
                            <ServerMember key={member.id} member={member} server={server}/>
                        ))}
                        </div>  
                    </div>
                )}
            </ScrollArea>
        </div>
    )
}

export default ServerSidebar