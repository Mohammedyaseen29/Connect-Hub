"use client"

import { cn } from "@/lib/utils";
import { Member, MemberRole, Profile,Server } from "@prisma/client"
import { ShieldAlert, ShieldCheck } from "lucide-react";
import { useParams,useRouter } from "next/navigation";
import UserAvatar from "../UserAvatar";

interface serverMemberProps{
    member:Member & {profile:Profile};
    server:Server;
}

const roleIconMap = {
    [MemberRole.GUEST]:null,
    [MemberRole.MODERATOR]:<ShieldCheck className="w-4 h-4 text-green-500 ml-1"/>,
    [MemberRole.ADMIN]:<ShieldAlert className="w-4 h-4 text-rose-500 ml-1"/>
}

const ServerMember = ({member,server}:serverMemberProps) => {
    const icon = roleIconMap[member.role as keyof typeof roleIconMap]
    const params = useParams();
    const router = useRouter();
    const onclick = ()=>{
        router.push(`/servers/${params?.serverId}/conversations/${member.id}`)
    }
    return (
        <button onClick={()=>onclick()} className={cn("flex items-center rounded-md mb-1 w-full group hover:bg-zinc-700/10 dark:hover:bg-zinc-700/50 p-2 transition gap-x-1.5",params?.memberId === member.id && "bg-zinc-700/20 dark:bg-zinc-700")}>
            <UserAvatar src={member.profile.imageUrl} className="w-8 h-8 md:h-8 md:w-8"/>
            <p className={cn("font-semibold text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-600 hover:dark:text-zinc-300 transition",params?.memberId === member.id && "text-primary dark:text-zinc-200 dark:group-hover:text-white")}>{member.profile.name}</p>
            {icon}
        </button>
    )
    }

export default ServerMember