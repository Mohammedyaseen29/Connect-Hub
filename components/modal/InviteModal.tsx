"use client"
import React from 'react'
import { useState} from 'react'
import { Dialog,DialogContent,DialogHeader,DialogTitle} from '../ui/dialog'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { useModal } from '@/Hooks/use-modal-hook'
import { Label } from '../ui/label'
import { Check, Copy, RefreshCw } from 'lucide-react'
import { useOrigin } from '@/Hooks/use-origin'
import axios from 'axios'





export const InviteModal = () => {
    const {onOpen,type,isopen,onClose,data} = useModal();
    const origin = useOrigin()

    const [copied,setcopied] =useState(false);
    const [isLoading,setLoading] = useState(false);

    const inviteUrl = `${origin}/invite/${data.server?.inviteCode}`
    const isOpenModal = isopen && type === "invite";  
    
    const onCopy= ()=>{
        navigator.clipboard.writeText(inviteUrl);
        setcopied(true)
        setTimeout(() => {
            setcopied(false)
        }, 1000);    
    }
    const onNew = async()=>{
        try {
            setLoading(true)
            const response = await axios.patch(`/api/servers/${data.server?.id}/invite-code`)
            onOpen("invite",{server:response.data});
        } catch (error) {
            console.log(error);
            
        }
        finally{
            setLoading(false)
        }
    }
    return (
        <Dialog open={isOpenModal} onOpenChange={onClose}>
            <DialogContent className='bg-white text-black p-0 overflow-hidden'>
                <DialogHeader className='pt-8 px-6'>
                    <DialogTitle className='text-xl font-bold text-center'>Invite Your Friends</DialogTitle>
                </DialogHeader>
                <div className='p-6'>
                    <Label className='uppercase text-xs font-bold text-zinc-500 dark:text-secondary/70'>Hub invite link</Label>
                    <div className='mt-2 flex'>
                        <Input disabled={isLoading}  className='bg-zinc-500/50 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-black' value={inviteUrl}/>
                        <Button disabled={isLoading} size="icon" className='ml-1' onClick={onCopy}>
                            {copied ? <Check className='w-4 h-4'/> : <Copy className='w-4 h-4'/>}
                        </Button>
                    </div>
                    <Button disabled={isLoading}  variant="link" size="sm" onClick={onNew} className='text-zinc-500 text-xs'>
                        Generate a new link
                        <RefreshCw className='w-4 h-4 ml-1'/>
                    </Button>
                    
                </div>
            </DialogContent>
        </Dialog>
    )
}
