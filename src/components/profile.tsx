'use client'

import {
    Menubar,
    MenubarContent,
    MenubarItem,
    MenubarMenu,
    MenubarTrigger,
} from "@/components/ui/menubar"
import { UserInfo } from "@/types/types"
import Link from "next/link"
import { AnimatedShinyTextComponent } from "./contact-ck"

export function Profile({ profileInfo, handleLogout }: {
    profileInfo: UserInfo | null,
    handleLogout: () => void
}) {

    return (
        <Menubar className="bg-transparent -mx-4 shadow-none border-none">
            <MenubarMenu>
                <MenubarTrigger>
                    <AnimatedShinyTextComponent userInfo={profileInfo?.me.wca_id} text="Logout" />
                </MenubarTrigger>
                <MenubarContent style={{zIndex: '10000'}} className="bg-neutral-950 border-stone-800 rounded-md text-stone-200">
                    <MenubarItem className="text-stone-400 hover:bg-none cursor-default">{profileInfo?.me.name}</MenubarItem>
                    {
                        profileInfo?.me.wca_id == "2017JOHN14" ? <Link href={"/requests"}><MenubarItem className="hover:bg-neutral-900 cursor-pointer">Requsets</MenubarItem></Link> : null
                    }
                    <MenubarItem onClick={handleLogout} className="hover-bg-red-500/10 hover:text-red-500 hover:bg-red-500/10 rounded-none cursor-pointer">Logout</MenubarItem>
                </MenubarContent>
            </MenubarMenu>
        </Menubar>
    )
}
