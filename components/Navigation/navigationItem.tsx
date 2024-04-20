"use client"
import React from 'react'
import ActionTooltip from '../actionTooltip'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import { useParams,useRouter } from 'next/navigation'
interface NavigationItemProp{
    id:string,
    name:string,
    imgUrl:string
}
const NavigationItem = ({id,name,imgUrl}:NavigationItemProp) => {
    const params = useParams();
    const router = useRouter();
    const onClick = ()=>{
        router.push(`/servers/${id}`)   
    }
    return (
        <div>
            <ActionTooltip label={name} side='right' align='center'>
                <button onClick={onClick} className='group relative flex items-center'>
                    <div className={cn("absolute left-0 bg-primary rounded-r-full transition-all w-[4px]",params?.serverId !==id && "group-hover:h-[20px]",params?.serverId===id ? "h-[36px]":"h-[8px]")}>
                    </div>
                    <div className={cn("relative group flex mx-3 h-[48px] w-[48px] rounded-[24px] group-hover:rounded-[16px] transition-all overflow-hidden",params?.serverId ===id && "bg-primary/10 text-primary rounded-[16px]" )}>
                        <Image fill src={imgUrl} alt='channel'/>
                    </div>
                </button>
            </ActionTooltip>
        </div>
    )
}

export default NavigationItem