"use client"
import { useModal } from "@/Hooks/use-modal-hook";
import { ServerWithMembersWithProfile } from "@/type"
import { ChannelType, MemberRole } from "@prisma/client"
import { Plus, Settings } from "lucide-react";
import ActionTooltip from "@/components/actionTooltip";

interface serverSectionProps{
    label:string;
    role?:MemberRole;
    sectionType:string;
    channelType?:ChannelType;
    server:ServerWithMembersWithProfile;
}

const ServerSection = ({label,role,sectionType,channelType,server}:serverSectionProps) => {
    const {onOpen} = useModal();
    return (
        <div className="flex items-center justify-between px-2 mb-1">
            <p className="text-zinc-500 dark:text-zinc-400 uppercase font-semibold text-xs">{label}</p>
            {role !== MemberRole.GUEST && sectionType === "channel" && (
            <ActionTooltip label="Create Streamline" side="top">
                <button onClick={()=>onOpen("createChannel",{channelType})} className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:scale-105 transition">
                    <Plus className="w-4 h-4"/>
                </button>
            </ActionTooltip>
            )}
            {role === MemberRole.ADMIN && sectionType === "member" && (
                <ActionTooltip label="settings" side="top">
                    <button onClick={()=>onOpen("members",{server})} className="text-zinc-500 hover:text-zinc-600 dark:text-zinc-400 hover:dark:text-zinc-300 transition">
                        <Settings className="w-4 h-4"/>
                    </button>
                </ActionTooltip>
            )}
        </div>
    )
}

export default ServerSection