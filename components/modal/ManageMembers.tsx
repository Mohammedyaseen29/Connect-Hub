"use client"
import React from 'react'
import { useState} from 'react'
import { Dialog,DialogContent,DialogDescription,DialogHeader,DialogTitle} from '@/components/ui/dialog'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { useModal } from '@/Hooks/use-modal-hook'
import { Label } from '../ui/label'
import { Check, Copy, Gavel, Loader2, MoreVertical, RefreshCw, Shield, ShieldAlert, ShieldCheck, ShieldQuestion } from 'lucide-react'
import axios from 'axios'
import qs from "query-string"
import { ServerWithMembersWithProfile } from '@/type'
import { ScrollArea } from '../ui/scroll-area'
import UserAvatar from '@/components/UserAvatar'
import { DropdownMenu,
        DropdownMenuContent,
        DropdownMenuSeparator,
        DropdownMenuTrigger,
        DropdownMenuItem,
        DropdownMenuSub,
        DropdownMenuSubContent,
        DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu'
import { MemberRole } from '@prisma/client'
import { useRouter } from 'next/navigation'





export const ManageModal = () => {
    const router = useRouter();
    const {type,isopen,onClose,data,onOpen} = useModal();
    const { server } = data as {server:ServerWithMembersWithProfile}
    const [loadingId,setLoadingId] = useState("");
    const roleIconMap ={
        "GUEST": null,
        "MODERATOR":<ShieldCheck className='h-4 w-4 ml-2 text-green-500'/>,
        "ADMIN":<ShieldAlert className='h-4 w-4 ml-2 text-rose-500'/>
    };
    const roleChange = async(memberId:string,role:MemberRole)=>{
        try {
            setLoadingId(memberId)
            const url = qs.stringifyUrl({
                url: `/api/members/${memberId}`,
                query:{
                    serverId: server.id,
                }
            }) 
            const response = await axios.patch(url,{role}); 
            router.refresh();
            onOpen("members",{server:response.data})
        } catch (error) {
            console.log(error);
        }
        finally{
            setLoadingId("")
        }
    }
    const onKick = async(memberId:string)=>{
        try {
            setLoadingId(memberId);
            const url = qs.stringifyUrl({
                url:`/api/members/${memberId}`,
                query:{
                    serverId:server.id
                }
            })
            const response = await axios.delete(url)
            router.refresh();
            onOpen("members",{server:response.data})
        } catch (error) {
            console.log(error);
            
        }
        finally{
            setLoadingId("")
        }

    }



    const isOpenModal = isopen && type === "members";  
    
    return (
        <Dialog open={isOpenModal} onOpenChange={onClose}>
            <DialogContent className='bg-white text-black overflow-hidden'>
                <DialogHeader className='pt-8 px-6'>
                    <DialogTitle className='text-xl font-bold text-center'>Manage Members</DialogTitle>
                    <DialogDescription className='text-center text-zinc-500'>
                        {server?.member?.length > 1 ? `${server?.member?.length} members` : `${server?.member?.length} member`} 
                    </DialogDescription>
                </DialogHeader>
                
                <ScrollArea className='mt-8'>
                    {server?.member?.map((member:any)=>(
                        <div key={member.id} className='flex items-center gap-x-2 mb-6'>
                            <UserAvatar src={member.profile.imageUrl}/>
                            <div>
                                <div className='flex mb-1'>
                                    <p className='text-xs font-semibold'>{member.profile.name}</p>
                                    <p>{roleIconMap[member.role as keyof typeof roleIconMap]}</p>
                                </div>
                                <p className='text-xs text-zinc-500'>{member.profile.email}</p>
                            </div>
                            {server.profileId !== member.profileId && loadingId !== member.id && (
                                <div className='ml-auto'>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger>
                                            <MoreVertical className='h-5 w-5 text-zinc-500'/>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent side='left'>
                                            <DropdownMenuSub>
                                                <DropdownMenuSubTrigger className=''>
                                                    <ShieldQuestion className='w-4 h-4 mr-2'/>
                                                    <span>Role</span>
                                                </DropdownMenuSubTrigger>
                                                <DropdownMenuSubContent>
                                                        <DropdownMenuItem onClick={()=>roleChange(member.id,"GUEST")}><Shield className='w-4 h-4 mr-2'/> Guest {member.role == "GUEST" && <Check className='ml-auto w-4 h-4'/>}</DropdownMenuItem>
                                                        <DropdownMenuItem onClick={()=>roleChange(member.id,"MODERATOR")}><ShieldCheck className='w-4 h-4 mr-2'/> Moderator {member.role == "MODERATOR" && <Check className='ml-2 w-4 h-4'/>}</DropdownMenuItem>
                                                </DropdownMenuSubContent>
                                            </DropdownMenuSub>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onClick={()=>onKick(member.id)}><Gavel className='w-4 h-4 mr-2'/> Kick</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            )}
                            {loadingId === member.id && <Loader2 className='w-4 h-4 animate-spin text-zinc-500 ml-auto'/>}
                        </div>
                    ))} 
                </ScrollArea>
            </DialogContent>
        </Dialog>
    )
}
