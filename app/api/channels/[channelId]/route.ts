
import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";
import { MemberRole } from "@prisma/client";
import { NextResponse } from "next/server";

export async function DELETE(req:Request,{params}:{params:{channelId:string}}){
    try {
        const profile = await currentProfile();
        const {searchParams} = new URL(req.url);
        const serverId = searchParams.get("serverId");
        if(!profile){
            return new NextResponse("UnAuthorized Access",{status:401});
        }
        if(!serverId){
            return new NextResponse("Missing ServerId",{status:400});
        }
        if(!params.channelId){
            return new NextResponse("Missing ChannelId",{status:400});
        }

        const server = await db.server.update({
            where:{
                id:serverId,
                member:{
                    some:{
                        profileId:profile.id,
                        role:{
                            in:[MemberRole.MODERATOR,MemberRole.ADMIN]
                        }
                    }
                }
            },
            data:{
                channel:{
                    delete:{
                        id:params.channelId,
                        name:{
                            not:"general"
                        }
                    }
                }
            }
        })
        return NextResponse.json(server);
    } catch (error) {
        console.log("[delete channel]",error);
        return new NextResponse("Internal Error",{status:500})
    }
}
export async function PATCH(req:Request,{params}:{params:{channelId:string}}) {
    try {
        const profile = await currentProfile();
        const {searchParams} = new URL(req.url);
        const serverId = searchParams.get("serverId");
        const {name,type} = await req.json();
        if(!profile){
            return new NextResponse("UnAuthorized Acces",{status:401});
        }
        if(!serverId){
            return new NextResponse("Missing ServerId",{status:400});
        }
        if(!params.channelId){
            return new NextResponse("Missing ChannelID",{status:400});
        }
        if(name === "general"){
            return new NextResponse("channel name should not be general",{status:400})
        }

        const server = await db.server.update({
            where:{
                id:serverId,
                member:{
                    some:{
                        profileId:profile.id,
                        role:{
                            in:[MemberRole.ADMIN,MemberRole.MODERATOR],
                        }
                    }
                }
            },
            data:{
                channel:{
                    update:{
                        where:{
                            id:params.channelId,
                            name:{
                                not:"general"
                            }
                        },
                        data:{
                            name,
                            type,
                        }
                    }
                }
            }
        })
        return NextResponse.json(server);
    } catch (error) {
        console.log("[Edit channel]",error);
        return new NextResponse("Internal server error",{status:500})
    }
}