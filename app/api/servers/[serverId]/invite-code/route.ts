import { currentProfile } from "@/lib/current-profile";
import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
export async function PATCH(req:Request,{ params: paramsPromise }:{params: Promise<{ serverId: string }>}){
    const params = await paramsPromise;
    try {
        const profile = await currentProfile();
        if(!profile){
            return new NextResponse("unAuthorized access",{status:401})
        }
        if(!params.serverId){
            return new NextResponse("Params is Missing!!",{status:400})
        }

        const server = await db.server.update({
            where:{
                id:params.serverId,
                profileId:profile.id
            },
            data:{
                inviteCode: randomUUID(),
            }
        })
        return NextResponse.json(server)
    } catch (error) {
        console.log("[SERVER_ID]",error);
        return new NextResponse("Internal Error",{status:500})
    }
}