"use client"
import React from 'react'
import axios from "axios"
import { useRouter } from 'next/navigation'
import { Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription, DialogFooter } from '../ui/dialog'
import { Form,FormControl,FormField,FormItem,FormLabel,FormMessage } from '../ui/form'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import {useForm} from "react-hook-form"
import * as z from "zod";
import { zodResolver } from '@hookform/resolvers/zod';
import { FileUpload } from '../FileUpload'
import { useModal } from '@/Hooks/use-modal-hook'



export const   CreateModal = () => {
    const {type,isopen,onClose} = useModal();

    const formSchema = z.object({
        name: z.string().min(1,{
            message:"Hub name is required"
        }),
        imageUrl: z.string().min(1,{
            message:"Hub image is required"
        })
    })

    const form = useForm({
        resolver:zodResolver(formSchema),
        defaultValues:{
            name:"",
            imageUrl:"",
        }
    })


    const isLoading = form.formState.isSubmitting;
    const router = useRouter()


    const onSubmit = async(values:z.infer<typeof formSchema>)=>{
        try {
            await axios.post("/api/servers",values);
            form.reset();
            router.refresh();
            onClose();
            
        } catch (error) {
            console.log(error);
            
        }
        
    }
    const isOpenModal = isopen && type === "createServer";
    const handleClose = ()=>{
        form.reset();
        onClose();
    }
    return (
        <Dialog open={isOpenModal} onOpenChange={handleClose}>
            <DialogContent className='bg-white text-black p-0 overflow-hidden'>
                <DialogHeader className='pt-8 px-6'>
                    <DialogTitle className='text-2xl font-bold text-center'>Create Your Hub</DialogTitle>
                    <DialogDescription className='text-center text-zinc-500'>Give your Hub a personality with name and an image.you can always change it later</DialogDescription>
                </DialogHeader>
                <Form {...form}>

                    <div className='mt-5 px-6 text-center'>
                    <FormField control={form.control} name='imageUrl' render={({field})=>(
                            <FormItem>
                                <FormControl>
                                    <FileUpload endpoint="serverImage" value={field.value} onChange={field.onChange}/>
                                </FormControl>
                            </FormItem>
                    )} ></FormField>
                        </div>

                    <FormField  control={form.control} name='name' render={({field})=>(
                        <FormItem className='px-6'>
                            <FormLabel className='uppercase text-xs font-bold text-zinc-500 dark:text-secondary/70'>Hub name</FormLabel>
                            <FormControl>
                                <Input className='bg-zinc-300/50 border-0 focus-visible:ring-0 focus-visible:ring-offset-0' placeholder='Enter Hub name' disabled={isLoading} {...field}/>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}>

                    </FormField>
                </Form>
                <DialogFooter className='bg-gray-100 px-6 py-4'>
                    <Button disabled={isLoading} variant="primary" onClick={form.handleSubmit(onSubmit)}>Create</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
