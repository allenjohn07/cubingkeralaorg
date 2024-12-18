"use client";

import React, { useState, useEffect } from "react";
import cookie from 'cookie';
import { UserInfo } from '@/types/types';
import { Profile } from './profile';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import CubingKeralaFooter from "./ck-footer";
import { Badge } from "./ui/badge";
import ShinyButton from "./ui/shiny-button";
import Link from "next/link";
import Image from "next/image";
import { AlignRight } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "./ui/sheet";

export default function NextUiNavbar() {

    const router = useRouter();
    const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

    useEffect(() => {
        const cookies = cookie.parse(document.cookie);
        const userInfoFromCookie = cookies.userInfo;

        if (userInfoFromCookie) {
            setUserInfo(JSON.parse(userInfoFromCookie));
        }
    }, []);

    async function handleLogout() {
        const response = await fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include',
        });

        if (response.ok) {
            toast.success('Logged out successfully');
            setTimeout(() => {
                window.localStorage.clear();
                window.location.reload();
            }, 2000);
            router.replace('/')
        } else {
            console.error('Logout failed');
            toast.error('Logout failed. Please try again.');
        }
    }

    const handleRedirectToPage = (page: string) => {
        router.push(`/${page}`)
    }


    return (
        <div style={{ zIndex: '10000' }} className="w-full bg-neutral-950/90 backdrop-blur-2xl flex sticky top-0 justify-between items-center px-5 md:px-10 p-2 pb-3">
            <div className="flex justify-between w-full">
                {/* larger screen */}
                <Link href={"/"} className="flex items-center">
                    <Image className="h-12 w-12" width={100} height={100} src="/logotransparent.png" alt="Cubing Kerala" />
                    <p className="font-bold text-stone-200 text-inherit mt-1 hidden lg:block">Cubing Kerala</p>
                    <Badge className="bg-neutral-900 hidden lg:block cursor-default h-5 mt-1 hover:bg-neutral-900 ml-2">
                        Beta
                    </Badge>
                </Link>
                <div className="hidden md:flex items-center text-stone-200 gap-5">
                    <Link className="hover:underline hover:underline-offset-4" href={"/competitions"}>Competitions</Link>
                    <Link className="hover:underline hover:underline-offset-4" href={"/members"}>Members</Link>
                    <Link className="hover:underline hover:underline-offset-4" href={"/rankings"}>Rankings</Link>
                    <Link className="hover:underline hover:underline-offset-4" href={"/classes"}>Classes</Link>
                    <Link className="hover:underline hover:underline-offset-4" href={"/contact"}>Contact</Link>
                    <div>
                        {
                            userInfo ? (
                                <Profile profileInfo={userInfo} handleLogout={handleLogout} />
                            ) : (
                                <Link href={"/login"}>
                                    <ShinyButton className="rounded-md text-sm px-3 py-[4px] bg-neutral-800 hover:bg-neutral-700 transition-all duration-200 ease-in">
                                        <span className="text-stone-200">Login</span>
                                    </ShinyButton>
                                </Link>
                            )
                        }
                    </div>
                </div>
                {/* Smaller screen */}
                <div className="md:hidden flex items-center gap-2">
                    <div>
                        {
                            userInfo ? (
                                <Profile profileInfo={userInfo} handleLogout={handleLogout} />
                            ) : (
                                <Link href={"/login"}>
                                    <ShinyButton className="rounded-md text-sm px-3 py-[4px] bg-neutral-800 hover:bg-neutral-700 transition-all duration-200 ease-in">
                                        <span className="text-stone-200">Login</span>
                                    </ShinyButton>
                                </Link>
                            )
                        }
                    </div>
                    <div className="w-fit h-fit">
                        <Sheet>
                            <SheetTrigger className="flex items-center border border-neutral-800 p-1 px-3 rounded-md">
                                <AlignRight className="w-5 h-5 text-stone-200" />
                            </SheetTrigger>
                            <SheetContent className="w-full bg-neutral-950 border-none">
                                <SheetHeader className="absolute top-2">
                                    <SheetTrigger onClick={() => handleRedirectToPage('')}>
                                        <SheetTitle>
                                            <div className="flex items-center">
                                                <Image className="h-12 w-12" width={100} height={100} src="/logotransparent.png" alt="Cubing Kerala" />
                                                <Badge className="bg-neutral-900 hidden md:block cursor-default h-5 mt-1 hover:bg-neutral-900 ml-2">
                                                    Beta
                                                </Badge>
                                            </div>
                                        </SheetTitle>
                                    </SheetTrigger>
                                    <SheetDescription className="py-2">
                                        <div className="text-stone-200 flex flex-col space-y-3">
                                            <SheetTrigger onClick={() => handleRedirectToPage('competitions')}><p className="text-[17px] text-start hover:underline hover:underline-offset-4">Competitions</p></SheetTrigger>
                                            <SheetTrigger onClick={() => handleRedirectToPage('members')}><p className="text-[17px] text-start hover:underline hover:underline-offset-4">Members</p></SheetTrigger>
                                            <SheetTrigger onClick={() => handleRedirectToPage('rankings')}><p className="text-[17px] text-start hover:underline hover:underline-offset-4">Rankings</p></SheetTrigger>
                                            <SheetTrigger onClick={() => handleRedirectToPage('classes')}><p className="text-[17px] text-start hover:underline hover:underline-offset-4">Classes</p></SheetTrigger>
                                            <SheetTrigger onClick={() => handleRedirectToPage('contact')}><p className="text-[17px] text-start hover:underline hover:underline-offset-4">Contact</p></SheetTrigger>
                                        </div>
                                    </SheetDescription>
                                </SheetHeader>
                                <SheetFooter className="absolute bottom-2 left-0 w-full px-2">
                                    <CubingKeralaFooter />
                                </SheetFooter>
                            </SheetContent>
                        </Sheet>
                    </div>
                </div>
            </div>
        </div>
    );
}

