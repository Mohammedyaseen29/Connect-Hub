import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentProfile } from "@/lib/current-profile";
import { DirectMessage, Message } from "@prisma/client";


export async function GET(req:Request){
    try {
        const MESSAGE_BATCH = 10;
        const profile = await currentProfile();
        const {searchParams} = new URL(req.url);
        const cursor = searchParams.get("cursor");
        const conversationId = searchParams.get("conversationId");

        if(!profile){
            return new NextResponse("UnAuthorized Access",{status:401});
        }
        if(!conversationId){
            return new NextResponse("ConversationId is Missing",{status:401});
        }
        let messages:DirectMessage[] = [];
        if(cursor){
            messages = await db.directMessage.findMany({
                take:MESSAGE_BATCH,
                skip:1,
                cursor:{
                    id:cursor
                },
                where:{
                    conversationId,
                },
                include:{
                    member:{
                        include:{
                            profile:true,
                        }
                    }
                },
                orderBy:{
                    createdAt:"desc"
                }
            },
            )
        }else{
            messages = await db.directMessage.findMany({
                take:MESSAGE_BATCH,
                where:{
                    conversationId,
                },
                include:{
                    member:{
                        include:{
                            profile:true,
                        }
                    }
                },
                orderBy:{
                    createdAt:"desc"
                }
            })
        }
        let nextCursor = null;
        if(messages.length === MESSAGE_BATCH){
            nextCursor = messages[MESSAGE_BATCH - 1].id;
        }
        return NextResponse.json({
            items:messages,
            nextCursor,
        });
    } catch (error) {
        console.log("[DIRECT_MESSAGE ROUTE ERROR]",error);
        return new NextResponse("Internal Error",{status:500});
    }
}