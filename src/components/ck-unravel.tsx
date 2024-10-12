"use client";

import DotPattern from "./magicui/dot-pattern";
import { cn } from "@/lib/utils";
import { FaWhatsapp } from "react-icons/fa";
import { FaInstagram } from "react-icons/fa";
import { RainbowButton } from "./ui/rainbow-button";
import ShinyButton from "./ui/shiny-button";

export function CubingKeralaUnravel() {

    const handleRedirectToWhatsapp = (): void => {
        window.open('https://chat.whatsapp.com/BQmcKIG0eKjLlDQYsPLHdS', '_blank');
    }

    const handleRedirectToInstagram = (): void => {
        window.open('https://www.instagram.com/cubingkerala', '_blank');
      }

    return (
        <div className="relative flex w-full flex-col bg-black text-stone-200 items-center justify-center overflow-hidden rounded-none py-12 md:py-24 lg:py-32">
            <div className="container px-6 z-20">
                <div className="grid gap-10 sm:px-10 md:gap-16 md:grid-cols-2">
                    <div className="space-y-4">
                        <div className="inline-block rounded-lg text-green-500 text-sm">About Cubing Kerala</div>
                        <h2 className="lg:leading-tighter text-3xl font-bold tracking-tighter sm:text-4xl md:text-7xl xl:text-[3.4rem] 2xl:text-[3.75rem]">
                            Unraveling the Cube, Connecting the Community
                        </h2>
                        <p className="mx-auto text-stone-400 max-w-[700px] md:text-xl/relaxed">
                            Cubing Kerala is a vibrant community of Rubik&apos;s Cube enthusiasts, founded in 2017 with the goal of
                            promoting the art of cubing in the state. Over the years, we have organized numerous competitions,
                            workshops, and social events, fostering a strong network of cubers and encouraging the growth of the
                            sport.
                        </p>
                    </div>
                    <div className="flex flex-col items-start space-y-4">
                        <div className="inline-block rounded-lg text-green-500 text-sm">Our Mission</div>
                        <p className="mx-auto max-w-[700px] text-stone-400 md:text-xl/relaxed">
                            At Cubing Kerala, our mission is to cultivate a vibrant cubing community, promote the sport, and
                            provide a platform for cubers to showcase their skills, connect with like- minded individuals, and
                            inspire the next generation of cubing enthusiasts.
                        </p>
                        <div className="w-full flex flex-col gap-5">
                            <div className="inline-block rounded-lg text-center md:text-start text-sm mt-5">Join us on socials</div>
                            <div className="flex gap-2 items-center justify-center md:justify-start text-sm">
                                <div onClick={handleRedirectToWhatsapp}>
                                    <ShinyButton className="bg-neutral-900 hover:bg-neutral-800 transition-all duration-200 ease-in-out">
                                        <div className="flex gap-1 items-center cursor-pointer text-green-400"><FaWhatsapp /> <span>Whatsapp</span></div>
                                    </ShinyButton>
                                </div>
                                <div onClick={handleRedirectToInstagram}>
                                    <ShinyButton className="bg-neutral-900 hover:bg-neutral-800 transition-all duration-200 ease-in-out">
                                        <div className="flex gap-1 items-center cursor-pointer text-green-400"><FaInstagram /> <span>Instagram</span></div>
                                    </ShinyButton>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <DotPattern
                width={20}
                height={20}
                cx={1}
                cy={1}
                cr={1}
                className={cn(
                    "[mask-image:linear-gradient(to_bottom_right,white,transparent,transparent)] ",
                )}
            />
        </div>
    );
}
