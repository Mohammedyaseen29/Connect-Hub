import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";
import { redirectToSignIn } from "@clerk/nextjs";
import { redirect } from "next/navigation";



const server = async({params}:{params:{serverId:string}}) => {
    const profile = await currentProfile();
    if(!profile){
        return redirectToSignIn();
    }

    const server = await db.server.findUnique({
        where:{
            id:params.serverId,
            member:{
                some:{
                    profileId:profile.id
                }
            }
        },
        include:{
            channel:{
                where:{
                    name:"general"
                },
                orderBy:{
                    createdAt:"asc"
                }
            }
        }
    })
    
    const initialChannel = server?.channel[0];
    if(initialChannel?.name !== "general"){
        return null;
    }
    return redirect(`/servers/${params.serverId}/channels/${initialChannel?.id}`)

}

export default server;  