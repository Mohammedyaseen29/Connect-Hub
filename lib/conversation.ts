
import { db } from "./db";

export const getOrCreateConversation = async(memberOneId:string,membertwoId:string)=>{
    let conversation = await findConversation(memberOneId,membertwoId) || await findConversation(membertwoId,memberOneId);
    if(!conversation){
        conversation = await createConversation(memberOneId,membertwoId);
    }
    return conversation;
}

const findConversation = async(memberOneId:string,membertwoId:string)=>{
    try {
        return await db.conversation.findFirst({
        where:{
            AND:[
                {memberOneId:memberOneId},
                {membertwoId:membertwoId}
            ]
        },
        include:{
            memberOne:{
                include:{
                    profile:true
                }
            },
            memberTwo:{
                include:{
                    profile:true
                }
            }
        }
    })
    } catch{
        return null;
    }
}

const createConversation = async(memberOneId:string,membertwoId:string)=>{
    try {
        return await db.conversation.create({
            data:{
                memberOneId,
                membertwoId,
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
    } catch{
        return null;
    }
}