
import { currentPagesProfile } from "@/lib/current-pagesprofile";
import { db } from "@/lib/db";
import { NextApiResponseServerio } from "@/type";
import { error } from "console";
import { NextApiRequest} from "next";

export default async function handler(req:NextApiRequest,res:NextApiResponseServerio){
    if(req.method !== "POST"){
        return res.status(405).json({error:"This method is not allowed!"})
    }
try {
    const profile = await currentPagesProfile(req);
    const {content,fileUrl} = req.body;
    const {conversationId} = req.query;
    if(!profile){
        return res.status(401).json({error:"UnAuthorized data"});
    }
    if(!content){
        return res.status(400).json({error:"content missing!"})
    }
    if(!conversationId){
        return res.status(400).json({error:"ConversationId is Missing!"})
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
                },
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
            },
        }
    })
    if(!conversation){
        return res.status(404).json({message:"Conversation not found"});
    }


    const member = conversation.memberOne.profileId === profile.id ? conversation.memberOne : conversation.memberTwo
    if(!member){
        return res.status(404).json({error:"member not found!"})
    }
        const message = await db.directMessage.create({
        data: {
            content,
            fileUrl,
            conversationId: conversationId as string,
            memberId: member.id,
        },
        include: {
            member: {
            include: {
                profile: true,
            }
            }
        }
        });

    const channelKey = `chat:${conversationId}:messages`;

    res?.socket?.server?.io?.emit(channelKey, message);

    return res.status(200).json(message);
} catch (error) {
    console.log("[DIRECT_MESSAGE ERROR]",error);
    return res.status(500).json({error:"Internal error"})
}
}