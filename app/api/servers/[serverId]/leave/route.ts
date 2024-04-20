import { currentProfile } from "@/lib/current-profile";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PATCH(req:Request,{params}:{params:{serverId:string}}){
try {
    const profile = await currentProfile();
    if(!profile){
        return new NextResponse("unAuthorized Access",{status:401})
    }
    if(!params.serverId){
        return new NextResponse("unAuthorized Access",{status:400})
    }
    const server = await db.server.update({
        where:{
            id:params.serverId,
            profileId:{
                not:profile.id
            },
            member:{
                some:{
                    profileId:profile.id
                }
            },
        },
        data:{
            member:{
                deleteMany:{
                    profileId:profile.id
                },
            }
        }
    })
    return NextResponse.json(server);
} catch (error) {
    console.log("[LEAVE SERVER]",error)
    return new NextResponse("Internal Error",{status:500})
}

}