import React from 'react'
import { db } from '@/lib/db'
import { currentProfile } from '@/lib/current-profile'
import { redirect } from 'next/navigation';
import NavigationAction from './navigationAction';
import { Separator } from '../ui/separator';
import { ScrollArea } from '../ui/scroll-area';
import NavigationItem from './navigationItem';
import { ModelToggle } from '../model-toggle';
import { UserButton } from '@clerk/nextjs';
import { Server } from '@prisma/client';


const NavigationSb = async() => {
    const profile = await currentProfile();
    if(!profile){
        return redirect("/")
    }
    const servers = await db.server.findMany({
        where:{
            member:{
                some:{
                    profileId:profile.id
                }
            }
        }
    })
    return (
        <div className='h-full w-full flex flex-col bg-[#E3E5E8]  dark:bg-[#1E1F22] py-3 space-y-4'>
            <NavigationAction />
            <Separator className='h-[2px] w-10 rounded-md bg-zinc-300 dark:bg-zinc-700 mx-auto' />
            <ScrollArea className='flex-1'>
                {servers.map((server:Server)=>(
                    <div key={server.id} className='mb-4'>
                        <NavigationItem id={server.id} name={server.name} imgUrl={server.imageUrl} />
                    </div>
                ))}
            </ScrollArea>
            <div className='flex flex-col items-center pb-3 gap-y-4 mt-auto'>
                <ModelToggle />
                <UserButton afterSignOutUrl='/' appearance={{
                    elements:{
                        avatarBox:"h-[48px] w-[48px]"
                    }
                }}/>
            </div>
        </div>
    )
}

export default NavigationSb