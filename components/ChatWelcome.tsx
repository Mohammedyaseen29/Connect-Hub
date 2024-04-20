"use client"

import { MessagesSquare } from "lucide-react";

interface ChatWelcomeProps{
    name:string;
    type:"channel" | "conversation";
}

const ChatWelcome = ({name,type}:ChatWelcomeProps) => {
    return (
        <div className="space-y-2 px-4 mb-4">
            {type === "channel" && (
                <div className="h-[75px] w-[75px] rounded-full bg-zinc-500 dark:bg-zinc-700 flex items-center justify-center">
                    <MessagesSquare className="text-white h-10 w-10"/>
                </div>
            )}
            <p className="text-xl md:text-3xl font-bold">
                {type === "channel" ? "Welcome to " : ""}{name}
            </p>
            <p className="text-zinc-600 dark:text-zinc-400 text-sm font-semibold">
                {type === "channel" ? `the place for lively discussions!`:`Here we go! Kicking off our chat with ${name}.`}
            </p>
        </div>
    )
}

export default ChatWelcome