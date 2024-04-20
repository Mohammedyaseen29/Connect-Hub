import { ModelToggle } from "@/components/model-toggle"
import {UserButton} from "@clerk/nextjs"
import {initialProfile} from "../../lib/initial-profile";
import { InitialModel } from "@/components/modal/InitialModel";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";


export default async function Home() {
  const profile = await initialProfile();
  const server = await db.server.findFirst({
    where:{
      member:{
        some:{
          profileId: profile.id
        }
      }
    }
  })
  if(server){
    return redirect(`servers/${server.id}`)  
    
  }

  return (
    <div>
      <InitialModel/>
    </div>
    
  )
}
