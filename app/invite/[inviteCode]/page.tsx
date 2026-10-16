import { currentProfile } from '@/lib/current-profile'
import { auth} from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';

const inviteCodePage = async({ params: paramsPromise }:{params: Promise<{ inviteCode: string }>}) => {
    const params = await paramsPromise;
    const profile = await currentProfile();
    const {redirectToSignIn} = await auth();
    if(!profile){
        return redirectToSignIn();
    }
    if(!params.inviteCode){
        return redirect("/");
    }
    
    const existingServer = await db.server.findFirst({
        where:{
            inviteCode:params.inviteCode,
            member:{
                some:{
                    profileId:profile.id
                }
            }
        }
    })
    if(existingServer){
        return redirect(`/servers/${existingServer.id}`);
    }
    const server = await db.server.update({
        where:{
            inviteCode:params.inviteCode
        },
        data:{
            member:{
                create:[
                    {profileId:profile.id}
                ]
            }
        }
    })
    if(server){
        return redirect(`/servers/${server.id}`)
    }

    return null
}

export default inviteCodePage