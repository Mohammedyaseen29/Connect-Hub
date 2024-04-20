import { currentUser,redirectToSignIn } from "@clerk/nextjs";
import { db } from "./db";


export async function initialProfile() {
    const User = await currentUser();
    if(!User){
        return redirectToSignIn();
    }
    const profile = await db.profile.findUnique({
        where:{
            userId:User.id
        }
    })
    if(profile){
        return profile;
    }
    const newProfile = await db.profile.create({
        data:{
            userId:User.id,
            name:`${User.firstName} ${User.lastName}`,
            imageUrl:User.imageUrl,
            email:User.emailAddresses[0].emailAddress
        }
    })
    return newProfile;
    
};
