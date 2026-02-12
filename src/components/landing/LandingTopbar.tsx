import * as React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import logo from "@/assets/invictus-logo.png";
import { getAppOrigin } from "@/lib/appOrigin";
import { motion, useScroll, useSpring } from "framer-motion";

export function LandingTopbar() {
  const appAuthUrl = `${getAppOrigin()}/auth`;
  const [scrolled, setScrolled] = React.useState(false);
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
        <header
        className={`fixed top-0 z-50 w-full transition-all duration-500 border-b ${
            scrolled
            ? "translate-y-0 bg-background/40 backdrop-blur-xl border-white/10" 
            : "translate-y-0 bg-transparent border-transparent"
        }`}
        >
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
            <Link to="/" className="flex flex-col items-center group" aria-label="Invictus">
                <img
                    src={logo}
                    alt="Logo da Invictus"
                    className="h-14 w-auto select-none transition-transform duration-500 group-hover:scale-105 drop-shadow-[0_0_15px_rgba(212,175,55,0.4)]"
                    draggable={false}
                />
                <span className="text-[11px] uppercase tracking-[0.6em] text-primary/90 font-medium leading-none mt-2 block font-serif">
                    Fraternidade
                </span>
            </Link>

            <nav className="flex items-center gap-6">
            <Button 
                variant="ghost" 
                className="hidden sm:flex text-muted-foreground hover:text-foreground hover:bg-transparent tracking-widest text-[10px] uppercase"
                asChild
            >
                <a href={appAuthUrl}>Acessar Sistema</a>
            </Button>
            
            <Button 
                className="invictus-cta bg-primary text-primary-foreground hover:bg-gold-hot font-bold tracking-[0.2em] text-[10px] uppercase px-6 h-9"
                onClick={() => document.getElementById("waitlist-section")?.scrollIntoView({ behavior: "smooth" })}
            >
                Seja Membro
            </Button>
            </nav>
        </div>

        {/* Progress Bar (Golden Line) */}
        <motion.div
            className="absolute bottom-0 left-0 right-0 h-[1px] bg-primary origin-left"
            style={{ scaleX }}
        />
        </header>
    </>
  );
}
