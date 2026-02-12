import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import logo from "@/assets/invictus-logo.png";

/**
 * CINEMATIC INTRO - THE GATE
 * 
 * Concept: A heavy, slow, and impactful reveal.
 * - Starts absolute black.
 * - Deep bass impact (visualized via shake/blur).
 * - "FRATERNIDADE" text reveals with a slow cinematic tracking.
 * - Logo burns in.
 */
export function HeroIntro({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = React.useState<"start" | "logo" | "text" | "exit">("start");

  React.useEffect(() => {
    // Adjusted Timeline for tighter cinematic feel
    const t1 = setTimeout(() => setPhase("logo"), 700);
    const t2 = setTimeout(() => setPhase("text"), 2500);
    const t3 = setTimeout(() => setPhase("exit"), 5000); // Hold text longer
    const t4 = setTimeout(onComplete, 6000);

    return () => {
      [t1, t2, t3, t4].forEach(clearTimeout);
    };
  }, [onComplete]);

  return (
    <AnimatePresence>
      {phase !== "exit" && (
        <motion.div
            key="intro-overlay"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
            className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black overflow-hidden pointer-events-none"
        >
            <div className="absolute inset-0 opacity-[0.08] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-repeat animate-pulse" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,black_100%)] opacity-90" />

            {/* Background Video Specific to Intro (Requested in Cycle 8) */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <video
           autoPlay
           loop
           muted
           playsInline
           className="w-full h-full object-cover opacity-30 scale-105"
           style={{ filter: "grayscale(100%) contrast(1.1)" }}
        >
           {/* Using a high-energy abstract/workout/discipline clip */}
           <source src="https://cdn.coverr.co/videos/coverr-crossfit-battle-ropes-1565/1080p.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-background/50 backdrop-blur-[2px]" />
      </div>

            <div className="relative z-10 flex flex-col items-center gap-12 md:gap-16">
                {/* LOGO REVEAL - Larger size */}
                {phase !== "start" && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, filter: "blur(20px)" }}
                        animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                        transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                        className="relative"
                    >
                        <div className="absolute inset-0 bg-primary/20 blur-[60px] rounded-full opacity-40 animate-pulse" />
                        <img 
                            src={logo} 
                            alt="Invictus Logo" 
                            className="w-48 md:w-64 relative z-10 drop-shadow-[0_0_35px_rgba(212,175,55,0.25)]"
                        />
                    </motion.div>
                )}

                {/* TEXT REVEAL - Adjusted font size & spacing */}
                {phase === "text" && (
                    <motion.div
                        initial={{ opacity: 0, letterSpacing: "1.5em", filter: "blur(12px)" }}
                        animate={{ opacity: 1, letterSpacing: "0.4em", filter: "blur(0px)" }}
                        transition={{ duration: 2.2, ease: "easeOut" }}
                        className="text-center"
                    >
                        <span 
                            className="text-primary/90 font-bold text-2xl md:text-4xl uppercase italic block"
                            style={{ fontFamily: "'Playfair Display', serif" }}
                        >
                            Fraternidade
                        </span>
                        <span className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-[0.8em] mt-4 block opacity-60">
                            Disciplina &gt; Talento
                        </span>
                    </motion.div>
                )}
            </div>

            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-32 h-[2px] bg-white/5 overflow-hidden rounded-full">
                <motion.div 
                    initial={{ x: "-100%" }}
                    animate={{ x: "0%" }}
                    transition={{ duration: 5, ease: "linear" }}
                    className="h-full w-full bg-primary/80"
                />
            </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
