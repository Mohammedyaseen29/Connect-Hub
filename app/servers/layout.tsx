import React from 'react'
import NavigationSb from '@/components/Navigation/navigation-sidebar'

    const mainlayout = async({children}:{children:React.ReactNode}) => {
    return (
        <div className='h-full'>
            <div className='hidden md:flex flex-col fixed w-[72px] inset-y-0 z-30 h-full'>
                <NavigationSb />
            </div>
            <main className='md:pl-[72px] h-full'>{children}</main>
        </div>
        
    )
    }

export default mainlayout