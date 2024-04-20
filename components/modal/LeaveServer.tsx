"use client"
import React from 'react'
import { useState} from 'react'
import { Dialog,DialogContent,DialogDescription,DialogFooter,DialogHeader,DialogTitle} from '../ui/dialog'
import { Button } from '../ui/button'
import { useModal } from '@/Hooks/use-modal-hook'

import axios from 'axios'
import { useRouter } from 'next/navigation'





export const LeaveModal = () => {
    const {type,isopen,onClose,data} = useModal();
    const isOpenModal = isopen && type === "leaveServer";
    const {server} = data;
    const [isloading,setLoading] = useState(false)
    const router = useRouter();
    const onclick = async()=>{
        try {
            setLoading(true)
            await axios.patch(`/api/servers/${server?.id}/leave`)
            onClose();
            router.refresh();
            router.push('/');
            
        } catch (error) {
            console.log(error)
        } finally{
            setLoading(false)
        }
    }
    
    
    
    
    return (
        <Dialog open={isOpenModal} onOpenChange={onClose}>
            <DialogContent className='bg-white text-black p-0 overflow-hidden'>
                <DialogHeader className='pt-8 px-6'>
                    <DialogTitle className='text-xl font-bold text-center'>Leave the Hub</DialogTitle>
                    <DialogDescription className='text-center text-zinc-500'>Are you sure you want to leave <span className='text-indigo-500 font-semibold'>{server?.name}</span>?</DialogDescription>
                </DialogHeader>
                <DialogFooter className='bg-gray-100 px-6 py-4'>
                    <div className='flex items-center justify-between w-full'>
                        <Button disabled={isloading} variant='ghost' onClick={onClose}>Cancel</Button>
                        <Button disabled={isloading} variant='primary' onClick={onclick}>Confirm</Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
