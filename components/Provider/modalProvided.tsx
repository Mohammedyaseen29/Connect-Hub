"use client"
import React from 'react'
import { CreateModal } from '@/components/modal/CreateModal'
import { InviteModal } from '@/components/modal/InviteModal'
import { useState,useEffect } from 'react'
import { EditServerModal } from '@/components/modal/EditServer'
import { ManageModal } from '@/components/modal/ManageMembers'
import { CreateChannel } from '@/components/modal/CreateChannel'
import { LeaveModal } from '@/components/modal/LeaveServer'
import { DeleteModal } from '@/components/modal/DeleteServer'
import { DeleteChannelModal } from '../modal/DeleteChannel'
import { EditChannel } from '../modal/EditChannel'
import { MessageFile } from '../modal/MessageFile'
import { DeleteMessageModal } from '../modal/DeleteMessage'

const ModalProvider = () => {
    const [isMounted,setMounted] = useState(false)

    useEffect(()=>{
        setMounted(true);
    },[])

    if(!isMounted){
        return null
    }
    return (
        <>
        <CreateModal />
        <InviteModal/>
        <EditServerModal/>
        <ManageModal/>
        <CreateChannel/>
        <LeaveModal/>
        <DeleteModal/>
        <DeleteChannelModal/>
        <EditChannel/>
        <MessageFile/>
        <DeleteMessageModal/>
        </>
    )
}

export default ModalProvider;
