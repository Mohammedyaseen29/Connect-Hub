import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";
import { auth } from '@clerk/nextjs/server';
import { redirect } from "next/navigation";



const server = async({params}:{params:{serverId:string}}) => {
    const profile = await currentProfile();
    const { redirectToSignIn } = await auth();
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