"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { io, Socket } from "socket.io-client";

type SocketContextType = { socket: Socket | null; isConnected: boolean };
const SocketContext = createContext<SocketContextType>({ socket: null, isConnected: false });
export const useSocket = () => useContext(SocketContext);

export const SockerProvider = ({ children }: { children: React.ReactNode }) => {
    const { getToken, isLoaded, userId } = useAuth();
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setConnected] = useState(false);

    useEffect(() => {
        if (!isLoaded || !userId) return;
        // Same origin works locally and behind a TLS reverse proxy without a build-time URL.
        const instance = io({
            path: "/api/socket/io",
            autoConnect: false,
            auth: async (done) => {
                try { done({ token: await getToken() }); }
                catch { done({ token: null }); }
            },
        });
        let retry: ReturnType<typeof setTimeout> | undefined;
        const reconnect = () => {
            clearTimeout(retry);
            retry = setTimeout(() => instance.connect(), 1000);
        };
        const onConnect = () => { clearTimeout(retry); setConnected(true); };
        const onDisconnect = (reason: string) => {
            setConnected(false);
            if (reason === "io server disconnect") reconnect();
        };
        const onError = () => { setConnected(false); reconnect(); };
        instance.on("connect", onConnect);
        instance.on("disconnect", onDisconnect);
        instance.on("connect_error", onError);
        setSocket(instance);
        instance.connect();
        return () => {
            clearTimeout(retry);
            instance.off("connect", onConnect);
            instance.off("disconnect", onDisconnect);
            instance.off("connect_error", onError);
            instance.disconnect();
            setSocket(null);
            setConnected(false);
        };
    }, [getToken, isLoaded, userId]);

    return <SocketContext.Provider value={{ socket, isConnected }}>{children}</SocketContext.Provider>;
};
