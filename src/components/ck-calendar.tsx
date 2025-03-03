import DotPattern from "./magicui/dot-pattern";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { AnimatedShinyTextComponent } from "./contact-ck";


export function CubingKeralaCalendars() {


    const router = useRouter();

    const handleRedirectToCompetitions = () => {
        router.push('/competitions')
    }

    return (
        <div className="relative flex py-12 md:py-24 lg:py-32 w-full flex-col items-center justify-center overflow-hidden rounded-none text-stone-200">
            <div className="container z-20 px-6">
                <div className="flex flex-col items-center justify-center space-y-4 text-start md:text-center">
                    <div className="space-y-4">
                        <div className="inline-block rounded-lg text-sm text-green-500">Upcoming Competitions</div>
                        <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-7xl">Mark Your Calendars</h2>
                        <p className="max-w-[900px] text-stone-400 text-[15px] md:text-lg">
                            Stay tuned for our upcoming Rubik&apos;s Cube competitions in Kerala.
                        </p>
                    </div>
                    <div className="flex items-center justify-start sm:justify-center md:justify-center w-full">
                        <div onClick={() => handleRedirectToCompetitions()}><AnimatedShinyTextComponent userInfo={null} text="Competitions" /></div>
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
