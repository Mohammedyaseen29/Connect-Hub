"use client"
import { ServerWithMembersWithProfile } from "@/type"
import { Server,MemberRole, ChannelType } from "@prisma/client"
import { DropdownMenu,DropdownMenuTrigger,DropdownMenuContent,DropdownMenuItem, DropdownMenuSeparator } from "../ui/dropdown-menu";
import { ChevronDown,LogOut, PlusCircle, Settings, Trash, UserPlus, Users } from "lucide-react";
import { Separator } from "../ui/separator";
import { useModal } from "@/Hooks/use-modal-hook";

interface ServerHeaderProps{
    server:ServerWithMembersWithProfile,
    role ?:MemberRole,
}



const ServerHeader = ({server,role}:ServerHeaderProps) => {
    const {onOpen} = useModal();
    const isAdmin = role === MemberRole.ADMIN;
    const isModerator = isAdmin || role === MemberRole.MODERATOR;
    return (
        <DropdownMenu>
            <DropdownMenuTrigger className="focus:outline-none" asChild>
                <button className="w-full rounded text-md font-semibold px-3 flex items-center h-12 border-neutral-200 dark:border-neutral-800 border-b-2 hover:bg-zinc-700/10 dark:hover-zinc-700/50 transition">
                    {server.name}
                    <ChevronDown className="h-5 w-5 ml-auto"/>
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 text-xs font-medium text-black dark:text-neutral-400 space-y-[2px]">
                {isModerator && (<DropdownMenuItem onClick={()=>onOpen("invite",{server})} className="text-green-500 dark:text-green-400 px-3 py-2 text-sm cursor-pointer"> Invite People  <UserPlus className="w-4 h-4 ml-auto"/>  </DropdownMenuItem>)
                }
                {isAdmin && (<DropdownMenuItem onClick={()=>onOpen("editServer",{server})} className="px-3 py-2 text-sm cursor-pointer "> Hub settings  <Settings className="w-4 h-4 ml-auto"/>  </DropdownMenuItem>)
                }
                {isAdmin && (<DropdownMenuItem onClick={()=>onOpen("members",{server})} className="px-3 py-2 text-sm cursor-pointer "> Manage Members  <Users className="w-4 h-4 ml-auto"/>  </DropdownMenuItem>)
                }
                {isModerator && (<DropdownMenuItem onClick={()=>onOpen("createChannel",{server})} className="px-3 py-2 text-sm cursor-pointer "> Create Streamline  <PlusCircle className="w-4 h-4 ml-auto"/>  </DropdownMenuItem>)
                }
                <DropdownMenuSeparator />
                {!isAdmin && (<DropdownMenuItem className="text-rose-500 px-3 py-2 text-sm cursor-pointer " onClick={()=>onOpen("leaveServer",{server})}> Leave Streamline  <LogOut className="w-4 h-4 ml-auto"/>  </DropdownMenuItem>)
                }
                {isAdmin && (<DropdownMenuItem className="text-red-500 px-3 py-2 text-sm cursor-pointer " onClick={()=>onOpen("deleteServer",{server})}> Delete Hub  <Trash className="w-4 h-4 ml-auto"/>  </DropdownMenuItem>)
                }
            </DropdownMenuContent>
            
        </DropdownMenu>
    )
}

export default ServerHeader