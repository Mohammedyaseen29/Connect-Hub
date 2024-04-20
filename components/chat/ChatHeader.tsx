import { Menu, MessagesSquare } from "lucide-react";
import MobileToggle from "../MobileToggle";
import UserAvatar from "../UserAvatar";
import { SocketIndicator } from "../socket-indicator";
import { ChatVideoButton } from "./Chat-vedio-button";
interface ChatHeaderSubProps{
    serverId:string;
    name:string;
    type:"channel" | "conversation";
    imageUrl?: string;
}

const ChatHeader = ({serverId,name,type,imageUrl}:ChatHeaderSubProps) => {
    return (
        <div className="font-semibold text-md px-3 flex items-center h-12 border-neutral-200 dark:border-neutral-800 border-b-2">
            <MobileToggle serverId={serverId}/>
            {type === "channel" &&(
                <MessagesSquare className="w-6 h-6 text-zinc-500 dark:text-zinc-400 ml-4" />
            )}
            {type === "conversation" &&(
                <UserAvatar src={imageUrl} className="w-8 h-8 md:w-8 md:h-8 mr-2"/>
            )}
            <p className="font-semibold text-md text-black dark:text-white ml-2">{name}</p>
            <div className="ml-auto flex items-center">
                {type === "conversation" && (
                    <ChatVideoButton />
                )}
                <SocketIndicator/>
            </div>
        </div>
    )
}

export default ChatHeader;