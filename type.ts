import { Server,Member,Profile } from "@prisma/client"
import {Server as NetServer,Socket} from "net";
import { NextApiResponse } from "next";
import {Server as SocketioServer} from "socket.io";

export type NextApiResponseServerio = NextApiResponse &{
    socket:Socket & {
        server:NetServer & {
            io:SocketioServer;
        }
    }
}

export type ServerWithMembersWithProfile = Server & {member:(Member & {profile:Profile})[]};