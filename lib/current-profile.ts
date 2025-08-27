import { auth } from "@clerk/nextjs/server";
import { db } from "./db";


export async function currentProfile(){

    const {userId} = await auth();

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