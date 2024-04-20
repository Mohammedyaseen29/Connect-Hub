"use client"
import {createContext,useContext,useState,useEffect} from "react";
import {io} from "socket.io-client";


type socketContextType = {
    socket:any | null ;
    isConnected : boolean ;
}

const socketContext = createContext<socketContextType>({
    socket:null,
    isConnected:false
})

export const useSocket = ()=>{
    return useContext(socketContext);
}

export const SockerProvider = ({children}:{children:React.ReactNode})=>{
    const [socket,setSocket] = useState(false);
    const [isConnected,setConnected] = useState(false);


    useEffect(()=>{
        const socketInstance = new (io as any)(process.env.NEXT_PUBLIC_SITE_URL!,{
            path:'/api/socket/io',
            addTrailingSlash:false,
        });
        socketInstance.on("connect",()=>{
            setConnected(true);
        })
        socketInstance.on("disconnect",()=>{
            setConnected(false);
        })
        setSocket(socketInstance);

        return ()=>{
            socketInstance.disconnect();
        }
    },[])

    return (
        <socketContext.Provider value={{socket,isConnected}}>{children}</socketContext.Provider>
    )
}