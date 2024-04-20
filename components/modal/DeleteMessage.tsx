"use client"
import React from 'react'
import { useState} from 'react'
import { Dialog,DialogContent,DialogDescription,DialogFooter,DialogHeader,DialogTitle} from '../ui/dialog'
import { Button } from '../ui/button'
import { useModal } from '@/Hooks/use-modal-hook'
import qs from "query-string";

import axios from 'axios'
import { useRouter } from 'next/navigation'





export const DeleteMessageModal = () => {
    const {type,isopen,onClose,data} = useModal();
    const isOpenModal = isopen && type === "deleteMessage";
    const {apiUrl,query} = data;
    const [isloading,setLoading] = useState(false)
    
    const onclick = async()=>{
        try {
            setLoading(true)
            const url = qs.stringifyUrl({
                url:apiUrl || "",
                query,
            })
            await axios.delete(url)
            onClose();
            
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
                    <DialogTitle className='text-xl font-bold text-center'>Delete Message</DialogTitle>
                    <DialogDescription className='text-center text-zinc-500'>Time to make this message disappear into digital void.<br/>Ready?</DialogDescription>
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
