
import { currentPagesProfile } from "@/lib/current-pagesprofile";
import { db } from "@/lib/db";
import { NextApiResponseServerio } from "@/type";
import { NextApiRequest} from "next";

export default async function handler(req:NextApiRequest,res:NextApiResponseServerio){
    if(req.method !== "POST"){
        return res.status(405).json({error:"This method is not allowed!"})
    }
try {
    const profile = await currentPagesProfile(req);
    const {content,fileUrl} = req.body;
    const {serverId,channelId} = req.query;
    if(!profile){
        return res.status(401).json({error:"UnAuthorized data"});
    }
    if(!content){
        return res.status(400).json({error:"content missing!"})
    }
    if(!serverId){
        return res.status(400).json({error:"ServerId is missing"})
    }
    if(!channelId){
        return res.status(400).json({error:"channelId is missing"})
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
    });
    if(!server){
        return res.status(404).json({error:"Server not found!"})
    }
    const channel = await db.channel.findFirst({
        where:{
            id:channelId as string,
            serverId:serverId as string,
        }
    })
    if(!channel){
        return res.status(404).json({error:"Channel not found!"})
    }
    const member = server.member.find((member:any)=> member.profileId === profile.id);
    if(!member){
        return res.status(404).json({error:"member not found!"})
    }
        const message = await db.message.create({
        data: {
            content,
            fileUrl,
            channelId: channelId as string,
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

    const channelKey = `chat:${channelId}:messages`;

    res?.socket?.server?.io?.emit(channelKey, message);

    return res.status(200).json(message);
} catch (error) {
    console.log("[MESSAGE ERROR]",error);
    return res.status(500).json({error:"Internal error"})
}
}