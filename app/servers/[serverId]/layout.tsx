import React from 'react'
import { db } from '@/lib/db';
import { currentProfile } from '@/lib/current-profile';
import { redirect } from 'next/navigation';
import { redirectToSignIn } from '@clerk/nextjs';
import ServerSidebar from '@/components/ServersComponent/serverSidebar';

const ServerIdlayout = async({children,params}:{children:React.ReactNode; params:{serverId:string}}) => {
    const profile = await currentProfile();

    if(!profile){
        return redirectToSignIn();
    }
    const server = await db.server.findUnique({
        where:{
            id:params.serverId,
            member:{
                some:{
                    profileId:profile.id
                }
            }
        }
    })

    if(!server){
        return redirect("/")
    }

    return (
        <div className=''>
            <div className='hidden md:flex flex-col h-full w-60 fixed z-20 inset-y-0'>
                <ServerSidebar serverId={params.serverId} />
            </div>
            <main className='h-full md:pl-60'>
                {children}
            </main>
        </div>
    )
}

export default ServerIdlayout