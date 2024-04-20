"use client"
import React from 'react'
import { UploadDropzone } from '@/lib/uploadthing'
import "@uploadthing/react/styles.css"
import { FileIcon, X } from 'lucide-react'
import Image from 'next/image'

interface FileUploadProps{
    endpoint : "serverImage" | "messageFile",
    onChange: (url?:string)=>void;
    value:string
}
    export const FileUpload = ({endpoint,onChange,value}:FileUploadProps) => {
        const fileType = value.split(".").pop();
        
        
        if(value && fileType !== "pdf"){
            return(
                <div className='h-20 w-20 relative mx-auto'>
                <Image fill src={value} alt='upload' className='rounded-full' />
                <button className='rounded-full bg-rose-500 absolute top-0 right-0 p-1 shadow-sm' onClick={()=>onChange("")}><X className='h-4 w-4 text-white'/></button>
            </div>
            )
        }
        if(value && fileType === "pdf"){
            return(
                <div className='relative flex items-center p-2 mt-2 rounded-md bg-background/10'>
                    <FileIcon className='h-10 w-10 fill-indigo-200 stroke-indigo-400'/>
                    <a href={value} target='_blank' rel='noopener noreferrer' className='ml-2 text-sm text-indigo-500 dark:text-indigo-400 hover:underline'>{value}</a>
                    <button className='rounded-full bg-rose-500 absolute -top-2 -right-2 p-1 shadow-sm' onClick={()=>onChange("")}><X className='h-4 w-4 text-white'/></button>
                </div>
            )
        }
    return (
        <div>
            <UploadDropzone endpoint={endpoint} onClientUploadComplete={(res)=>{
            onChange(res?.[0].url);
        }}
        onUploadError={(error:Error)=>{console.log(error)}}
        />
        </div>
    )
    }
