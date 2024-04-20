import { currentProfile } from "@/lib/current-profile"
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function DELETE(req:Request,{params}:{params:{memberId:string}}) {
    try {
        const profile = await currentProfile();
        if(!profile){
            return new NextResponse("unAuthorized Acces",{status:401})
        }
        const {searchParams} = new URL(req.url);
        const serverId = searchParams.get("serverId");

        if(!serverId){
            return new NextResponse("Missing ServerID",{status:400})
        }
        if(!params.memberId){
            return new NextResponse("Missing memberId",{status:400})
        }

        const server = await db.server.update({
            where:{
                id:serverId,
                profileId:profile.id,
            },
            data:{
                member:{
                    deleteMany:{
                        id:params.memberId,
                        profileId: {not:profile.id}
                    }
                }
            },
            include:{
                member:{
                    include:{
                        profile:true
                    },
                    orderBy:{
                        role:"asc"
                    }
                }
            }
        })
        return NextResponse.json(server);



    } catch (error) {
        console.log("Error in KickMember", error);
        return new NextResponse("Internal Error",{status:500})

    }
}






export async function PATCH(req:Request,{params}:{params:{memberId:string}}){
    try {
        const profile = await currentProfile();
        if(!profile){
            return new NextResponse("UnAuthorized Acces",{status:401})
        }
        const {searchParams} = new URL(req.url);
        const {role} = await req.json();
        const serverId = searchParams.get("serverId");
        
        
        if(!serverId){
            return new NextResponse("Missing serverId",{status:400})
        }
        if(!params.memberId){
            return new NextResponse("Missing memberId",{status:400})
        }

        const server = await db.server.update({
            where:{
                id:serverId,
                profileId:profile.id,
            },
            data:{
                member:{
                    update:{
                        where:{
                        id:params.memberId,
                        profileId:{not:profile.id}
                        },
                        data:{
                            role
                        }
                    }
                }
            },
            include:{
                member:{
                    include:{
                        profile:true,
                    },
                    orderBy:{
                        role: "asc"
                    }
                }
            }
        })
        return NextResponse.json(server);

    } catch (error) {
        console.log("[ROLE_CHANGE ENDPOINT PATCH]",error)
        return new NextResponse("Internal Error",{status:500})
    }
}