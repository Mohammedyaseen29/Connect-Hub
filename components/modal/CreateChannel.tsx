"use client"
import React, { useEffect } from 'react'
import axios from "axios"
import { useParams, useRouter } from 'next/navigation'
import { Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription, DialogFooter } from '../ui/dialog'
import { Form,FormControl,FormField,FormItem,FormLabel,FormMessage } from '../ui/form'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import {useForm} from "react-hook-form"
import * as z from "zod";
import { zodResolver } from '@hookform/resolvers/zod';
import { useModal } from '@/Hooks/use-modal-hook'
import { ChannelType } from '@prisma/client'
import { Select,SelectContent,SelectItem,SelectTrigger,SelectValue } from '../ui/select'
import qs from "query-string"



export const   CreateChannel = () => {
    const {type,isopen,onClose,data} = useModal();

    const formSchema = z.object({
        name: z.string().min(1,{
            message:"Streamline name is required"
        }).refine(name=>name !== "general",{message:"Streamline name cannot be 'general'"}),
        type: z.nativeEnum(ChannelType)
    })
    const {channelType} = data;

    const form = useForm({
        resolver:zodResolver(formSchema),
        defaultValues:{
            name:"",
            type:channelType || ChannelType.TEXT,
        }
    })
    useEffect(()=>{
        if(channelType){
            form.setValue("type",channelType)
        }else{
            form.setValue("type",ChannelType.TEXT)
        }
    },[form,channelType])


    const isLoading = form.formState.isSubmitting;
    const router = useRouter()
    const params = useParams()


    const onSubmit = async(values:z.infer<typeof formSchema>)=>{
        try {
            const url = qs.stringifyUrl({
                url:"/api/channels",
                query:{
                    serverId:params?.serverId
                }
            })
            await axios.post(url,values);
            form.reset();
            router.refresh();
            onClose();
            
        } catch (error) {
            console.log(error);
            
        }
        
    }
    const isOpenModal = isopen && type === "createChannel";
    const handleClose = ()=>{
        form.reset();
        onClose();
    }
    return (
        <Dialog open={isOpenModal} onOpenChange={handleClose}>
            <DialogContent className='bg-white text-black p-0 overflow-hidden'>
                <DialogHeader className='pt-8 px-6'>
                    <DialogTitle className='text-2xl font-bold text-center'>Create Your Streamline</DialogTitle>
                    <DialogDescription className='text-center text-zinc-500'>Give your Streamline with name and type.</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <div className='mt-4'>
                        <FormField  control={form.control} name='name' render={({field})=>(
                            <FormItem className='px-6'>
                                <FormLabel className='uppercase text-xs font-bold text-zinc-500 dark:text-secondary/70'>Streamline name</FormLabel>
                                <FormControl>
                                    <Input className='bg-zinc-300/50 border-0 focus-visible:ring-0 focus-visible:ring-offset-0' placeholder='Enter Streamline name' disabled={isLoading} {...field}/>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                    )}/>
                    <div className='px-6 mt-2'>
                        <FormField control={form.control} name='type' render={({field})=>(
                        <FormItem>
                            <FormLabel className='text-zinc-500 font-bold text-xs dark:text-secondary/70'>STREAMLINE TYPE</FormLabel>
                            <Select disabled={isLoading} onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger className='bg-zinc-300/50 border-0 focus:ring-0 ring-offset-0 focus:ring-offset-0 capitalize outline-none'>
                                        <SelectValue placeholder="Select a Channel Type" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>{Object.values(ChannelType).map((type)=>(
                                    <SelectItem key={type} value={type} className='capitalize'>{type.toLowerCase()}</SelectItem>
                                ))}
                                </SelectContent>
                            </Select>
                        </FormItem>
                    )} />
                    </div>
                    </div>
                </Form>
                <DialogFooter className='bg-gray-100 px-6 py-4'>
                    <Button disabled={isLoading} variant="primary" onClick={form.handleSubmit(onSubmit)}>Create</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
