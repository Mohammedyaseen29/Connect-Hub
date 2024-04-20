import { NextApiRequest } from "next";
import { NextApiResponseServerio } from "@/type";
import { currentPagesProfile } from "@/lib/current-pagesprofile";
import { db } from "@/lib/db";
import { MemberRole } from "@prisma/client";

export default async function handler(req:NextApiRequest,res:NextApiResponseServerio){
    if(req.method !== "DELETE" && req.method !== "PATCH"){
        return res.status(405).json({error:"Method not allowed"})
    }
    try {
        const profile = await currentPagesProfile(req);
        const {messageId,serverId,channelId} = req.query;
        const {content} = req.body;

        if(!profile){
            return res.status(401).json({error:"Unauthorized acces"});
        }
        if(!serverId){
            return res.status(400).json({error:"ServerId is missing"})
        }
        if(!channelId){
            return res.status(400).json({error:"ChannelId is missing"})
        }
        const server = await db.server.findFirst({
            where:{
                id:serverId as string,
                member:{
                    some:{
                        profileId:profile.id,
                    }
                }
            },
            include:{
                member:true,
            }
        })
        if(!server){
            return res.status(400).json({error:"server is not found!"})
        }

        const channel = await db.channel.findFirst({
            where:{
                id:channelId as string,
                serverId: serverId as string,
            }
        })
        if(!channel){
            return res.status(400).json({error:"Channel is not found"})
        }
        const member = server.member.find((member:any)=>member.profileId === profile.id);
        if(!member){
            return res.status(400).json({error:"Member not found"})
        }

        let message = await db.message.findFirst({
            where:{
                id: messageId as string,
                channelId: channelId as string,
            },
            include:{
                member:{
                    include:{
                        profile:true
                    }
                }
            }
        })
        if(!message || message.deleted){
            return res.status(400).json({error:"Message not found"})
        }

        const messageOwner = message.memberId === member.id;
        const Admin = member.role === MemberRole.ADMIN;
        const Moderator = member.role === MemberRole.MODERATOR;
        const canModify = messageOwner || Admin || Moderator;
        
        if(!canModify){
            return res.status(401).json({error:"UnAuthorized access"})
        }
        if(req.method === "DELETE"){
            message = await db.message.update({
                where:{
                    id:messageId as string,
                },
                data:{
                    fileUrl:null,
                    content:"This message has gone incognito. Deleted!",
                    deleted:true,
                },
                include:{
                    member:{
                        include:{
                            profile:true,
                        }
                    }
                }
            })
        }
        if(req.method === "PATCH"){
            if(!messageOwner){
                return res.status(401).json({error:"UnAuthorized access"})
            }
            message = await db.message.update({
                where:{
                    id:messageId as string,
                },
                data:{
                    content,
                },
                include:{
                    member:{
                        include:{
                            profile:true,
                        }
                    }
                }
            })
        }
        const updateKey = `chat:${channelId}:messages:update`;
        res?.socket?.server?.io?.emit(updateKey,message);
        return res.status(200).json(message)
    } catch (error) {
        console.log("[Message_id]",error);
        return res.status(500).json({error:"Internal Server error"})
    }
}