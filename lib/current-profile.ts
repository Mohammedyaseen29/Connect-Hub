import { auth } from "@clerk/nextjs";
import { db } from "./db";


export async function currentProfile(){

    const {userId} = auth();

    if(!userId){
        return null;
    }

    const profile = await db.profile.findUnique({
        where:{
            userId,
        }
    });
    return profile;
}