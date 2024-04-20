"use client"

import { Search } from "lucide-react";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";


interface ServerSearchData{
    data:{
        label:string,
        type:"member"|"channel",
        data:{
            id:string;
            name:string;
            icon:React.ReactNode;
        }[] | undefined
    }[]
}


const ServerSearch = ({data}:ServerSearchData) => {

    const router = useRouter();
    const params = useParams();

    const [open,setOpen] = useState(false);
    useEffect(()=>{
        const down = (e:KeyboardEvent)=>{
            if(e.key =="s" && (e.metaKey || e.ctrlKey)){
                e.preventDefault();
                setOpen((open)=>!open);
            }
        }
        document.addEventListener("keydown",down);
        return ()=> document.removeEventListener("keydown",down)
    },[]);

    const onclick = ({id,type}:{id:string,type:string})=>{
        setOpen(false)
        if(type == "channel"){
            return router.push(`/servers/${params?.serverId}/channels/${id}`)
        }
        if(type == "member"){
            return router.push(`/servers/${params?.serverId}/conversations/${id}`)
        }
    }

    return (
        <>
            <button onClick={()=>setOpen(true)} className="group p-2 rounded-md flex items-center gap-x-2 w-full hover:bg-zinc-700/10 dark:hover:bg-zinc-700/50 transition">
                    <Search className="w-4 h-4 text-zinc-500 dark:text-zinc-400"/>
                    <p className="font-semibold text-sm text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition">Search</p>
                    <kbd className="pointer-event-none select-none text-[10px] rounded border px-1 font-mono font-medium ml-auto bg-muted text-muted-foreground">
                        <span className="text-xs">ctrl</span> s
                    </kbd>
            </button>
            <CommandDialog open={open} onOpenChange={setOpen}>
                <CommandInput placeholder="Search all Members and Streamlines"></CommandInput>
                <CommandList>
                    <CommandEmpty>No Results Found</CommandEmpty>
                    {data.map(({label,type,data})=>{
                        if(!data?.length) return null
                        return(
                            <CommandGroup key={label} heading={label}>
                                {data.map(({id,icon,name})=>{
                                    return(
                                        <CommandItem key={id} onSelect={()=>onclick({id,type})}>{icon} <span>{name}</span></CommandItem>
                                    )
                                })}
                            </CommandGroup>
                        )
                    })}
                </CommandList>
            </CommandDialog>
        </>
    )
}

export default ServerSearch