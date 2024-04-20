import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function DELETE(req:Request,{params}:{params:{serverId:string}}){
    try {
        const profile = await currentProfile();
        if(!profile){
            return new NextResponse("UnAuthorized Access!",{status:401})
        }
        if(!params.serverId){
            return new NextResponse("Missing serverId",{status:400})
        }
        const server = await db.server.delete({
            where:{
                id:params.serverId,
                profileId:profile.id
            }
        })
        return NextResponse.json(server)

    } catch (error) {
        console.log("DELETE_ERROR",error)
        return new NextResponse("Internal error",{status:500})
    }
}










export async function PATCH(req:Request,{params}:{params:{serverId:string}}){
    try {
        const profile = await currentProfile()
        if(!profile){
            return new NextResponse("Unauthorized Access",{status:401})
        }
        const {name,imageUrl} = await req.json();
        const server = await db.server.update({
                where:{
                    id:params.serverId,
                    profileId:profile.id
                },
                data:{
                    name,
                    imageUrl,
                }
            });
        return NextResponse.json(server)
    } catch (error) {
        console.log("[editSERVER ENDPOINT]",error);
        return new NextResponse("Internal Error",{status:500});
    }
}