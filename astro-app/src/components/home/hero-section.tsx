import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WHATSAPP_GROUP_URL } from "@/config/social";

export default function HeroSection() {
  return (
    <section className="pb-8 pt-10 sm:pt-12">
      <div className="mx-auto max-w-160 px-5 lg:max-w-3xl lg:text-center">
        <h1 style={{ animationDelay: "0ms" }} className="motion-safe:animate-fade-up text-[clamp(2.5rem,9vw,3.5rem)] font-medium leading-none tracking-[-0.04em]">
          The Rubik&apos;s Cube
          <br />
          <span className="text-primary">community</span> in Kerala.
        </h1>
        <p style={{ animationDelay: "100ms" }} className="motion-safe:animate-fade-up mt-5 text-lg font-medium tracking-tight">
          Home to cubers from all the districts in Kerala.
        </p>
        <p style={{ animationDelay: "200ms" }} className="motion-safe:animate-fade-up mt-2.5 text-sm text-muted-foreground">
          Connect with fellow cubers for discussions, competition updates, and everything
          happening in the community.
        </p>
        <div style={{ animationDelay: "300ms" }} className="motion-safe:animate-fade-up mt-7 lg:flex lg:justify-center">
          <Button size="lg" asChild>
            <a href={WHATSAPP_GROUP_URL} target="_blank" rel="noopener noreferrer">
              Join WhatsApp
              <ArrowUpRight />
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}
