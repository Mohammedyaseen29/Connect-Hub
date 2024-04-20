import { ChatMessages } from '@/components/ChatMessages';
import ChatHeader from '@/components/chat/ChatHeader';
import ChatInput from '@/components/chat/ChatInput';
import { currentProfile } from '@/lib/current-profile';
import { db } from '@/lib/db';
import { redirectToSignIn } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import { ChannelType } from '@prisma/client';
import { MediaRoom } from '@/components/media-room';


interface chatheaderProps{
    params:{
        serverId:string;
        channelId:string;
    }
}
const page = async({params}:chatheaderProps) => {
    const profile = await currentProfile();
    if(!profile){
        return redirectToSignIn();
    }
    const channel = await db.channel.findUnique({
        where:{
            id:params.channelId,
        }
    })
    const member = await db.member.findFirst({
        where:{
            serverId:params.serverId,
            profileId:profile.id
        }
    })
    if(!channel || !member){
        redirect("/");
    }
    return (
        <div className='bg-white dark:bg-[#313338] flex flex-col h-screen'>
            <ChatHeader serverId={channel.serverId} name={channel.name} type="channel"/>
            {channel.type === ChannelType.TEXT && (
                <>
                    <ChatMessages name={channel.name} member={member} chatId={channel.id} type="channel" apiUrl='/api/messages' socketUrl='/api/socket/messages' socketQuery={{channelId:channel.id,serverId:channel.serverId}} paramKey='channelId' paramValue={channel.id}/>
                    <ChatInput apiUrl='/api/socket/messages' name={channel.name} type='channel' query={{channelId:channel.id,serverId:channel.serverId}}/>
                </>
            )}
            {channel.type === ChannelType.AUDIO && (
                <MediaRoom chatId={channel.id} video={false} audio={true}/>
            )}
            {channel.type === ChannelType.VIDEO && (
                <MediaRoom chatId={channel.id} video={true} audio={true}/>
            )}
        </div>
    )
}

export default page