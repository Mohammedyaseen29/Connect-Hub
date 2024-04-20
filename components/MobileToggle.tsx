import { Menu } from "lucide-react"
import { Button } from "./ui/button"
import { Sheet,SheetTrigger,SheetContent } from "./ui/sheet"
import NavigationSb from "./Navigation/navigation-sidebar"
import ServerSidebar from "./ServersComponent/serverSidebar"

const MobileToggle = ({serverId}:{serverId:string}) => {
    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu/>
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex p-0 gap-0">
                    <div className="w-[72px]">
                        <NavigationSb/>
                    </div>
                    <ServerSidebar serverId={serverId}/>
            </SheetContent>
        </Sheet>
    )
}

export default MobileToggle