"use client"

import React from 'react'
import { ServerCrash } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

export  const GlobalError = () => {
    const router = useRouter()
    const handleClick = ()=>{
        router.refresh();
    }
    return (
        <div className='flex flex-col justify-center items-center min-h-screen'>
            <ServerCrash className='w-20 h-20 text-zinc-500 dark:text-zinc-400' />
            <h3 className='text-lg font-semibold mt-3 text-zinc-500 dark:text-zinc-400'>Oops! Something Went Wrong!</h3>
            <Button className='bg-emerald-500 px-6 py-2' onClick={()=>handleClick}>Try again</Button>
        </div>
    )
}


