"use client"
import React from 'react'
import axios from "axios"
import { useRouter } from 'next/navigation'
import qs from "query-string";
import { Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription, DialogFooter } from '../ui/dialog'
import { Form,FormControl,FormField,FormItem,FormLabel,FormMessage } from '../ui/form'
import { Button } from '../ui/button'
import {useForm} from "react-hook-form"
import * as z from "zod";
import { zodResolver } from '@hookform/resolvers/zod';
import { FileUpload } from '../FileUpload'
import { useModal } from '@/Hooks/use-modal-hook'


export const MessageFile = () => {
    const formSchema = z.object({
        fileUrl: z.string().min(1,{
            message:"Attachment is required"
        })
    })
    const form = useForm({
        resolver:zodResolver(formSchema),
        defaultValues:{
            fileUrl:"",
        }
    })
    const {type,isopen,onClose,data} = useModal();
    const {apiUrl,query} = data;
    const isLoading = form.formState.isSubmitting;
    const router = useRouter()
    const Modalopen = isopen && type === "messageFile"; 

    const handleClose = ()=>{
        form.reset();
        onClose();
    }


    const onSubmit = async(values:z.infer<typeof formSchema>)=>{
        try {
            const url = qs.stringifyUrl({
                url:apiUrl || "",
                query
            })
            await axios.post(url,{...values,content:values.fileUrl});
            router.refresh();
            handleClose();          
            
        } catch (error) {
            console.log(error);
            
        }
        
    }

    return (
        <Dialog open={Modalopen} onOpenChange={handleClose}>
            <DialogContent className='bg-white text-black p-0 overflow-hidden'>
                <DialogHeader className='pt-8 px-6'>
                    <DialogTitle className='text-2xl font-bold text-center'>File Drop!!</DialogTitle>
                    <DialogDescription className='text-center text-zinc-500'>Drop a File Here to Send a Message</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <div className='mt-5 px-6 text-center'>
                    <FormField control={form.control} name='fileUrl' render={({field})=>(
                            <FormItem>
                                <FormControl>
                                    <FileUpload endpoint="messageFile" value={field.value} onChange={field.onChange}/>
                                </FormControl>
                            </FormItem>
                    )} >
                    </FormField>
                    </div>
                </Form>
                <DialogFooter className='bg-gray-100 px-6 py-4'>
                    <Button disabled={isLoading} variant="primary" onClick={form.handleSubmit(onSubmit)}>Drop it!</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
