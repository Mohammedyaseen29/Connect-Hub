"use client"
import { Plus } from 'lucide-react'
import ActionTooltip from '../actionTooltip'
import React from 'react'
import { useModal } from '@/Hooks/use-modal-hook'


const NavigationAction = () => {
    const {onOpen} = useModal()
    return (
        <div>
            <button className='group' onClick={()=>onOpen("createServer")}>
                <div className='mx-3 h-[48px] w-[48px] flex items-center justify-center rounded-[24px] group-hover:rounded-[16px] transition-all overflow-hidden bg-background dark:bg-neutral-700 group-hover:bg-emerald-500'>
                    <Plus size={25} className='group-hover:text-white text-emerald-500 transition'/>
                </div>
            </button>
        </div>
    )
}

export default NavigationAction