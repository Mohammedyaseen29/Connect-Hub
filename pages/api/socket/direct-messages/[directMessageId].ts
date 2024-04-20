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
        const {directMessageId,conversationId} = req.query;
        const {content} = req.body;

        if(!profile){
            return res.status(401).json({error:"Unauthorized acces"});
        }
        if(!conversationId){
            return res.status(400).json({error:"conversationId is missing"})
        }
        
        const conversation = await db.conversation.findFirst({
            where:{
                id: conversationId as string,
                OR:[
                    {
                        memberOne:{
                            profileId:profile.id,
                        }
                    },
                    {
                        memberTwo:{
                            profileId:profile.id,
                        }
                    }
                ]
            },
            include:{
                memberOne:{
                    include:{
                        profile:true,
                    }
                },
                memberTwo:{
                    include:{
                        profile:true,
                    }
                }
            }
        })
        if(!conversation){
            return res.status(400).json({error:"conversation not found"})
        }
        const member = conversation.memberOne.profileId === profile.id ? conversation.memberOne : conversation.memberTwo;
        if(!member){
            return res.status(400).json({error:"Member not found"})
        }

        let directMessage = await db.directMessage.findFirst({
            where:{
                id: directMessageId as string,
                conversationId: conversationId as string,
            },
            include:{
                member:{
                    include:{
                        profile:true
                    }
                }
            }
        })
        if(!directMessage || directMessage.deleted){
            return res.status(400).json({error:"Message not found"})
        }

        const messageOwner = directMessage.memberId === member.id;
        const Admin = member.role === MemberRole.ADMIN;
        const Moderator = member.role === MemberRole.MODERATOR;
        const canModify = messageOwner || Admin || Moderator;
        
        if(!canModify){
            return res.status(401).json({error:"UnAuthorized access"})
        }
        if(req.method === "DELETE"){
            directMessage = await db.directMessage.update({
                where:{
                    id:directMessageId as string,
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
            directMessage = await db.directMessage.update({
                where:{
                    id:directMessageId as string,
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
        const updateKey = `chat:${conversationId}:messages:update`;
        res?.socket?.server?.io?.emit(updateKey,directMessage);
        return res.status(200).json(directMessage)
    } catch (error) {
        console.log("[directMessage_id]",error);
        return res.status(500).json({error:"Internal Server error"})
    }
}