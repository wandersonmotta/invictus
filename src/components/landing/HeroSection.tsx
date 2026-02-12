import * as React from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { useMagneticHover } from "@/hooks/useMagneticHover";
import { Shield } from "lucide-react";
import heroBg from "@/assets/hero-bg-operator.png";

export function HeroSection() {
  const containerRef = React.useRef<HTMLElement>(null);
  // const magneticBtnRef = useMagneticHover<HTMLButtonElement>(0.4); // Removed unused ref
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  // Parallax effects
  const yText = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacityText = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scaleText = useTransform(scrollYProgress, [0, 1], [1, 0.9]);
  
  // Massive background text parallax
  const yBgText = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);

  return (
    <section 
      ref={containerRef} 
      className="relative min-h-[100svh] w-full flex flex-col items-center justify-center overflow-hidden bg-transparent px-4"
    >
      {/* 
        VIDEO BACKGROUND (Requested: "Disciplina > Talento" content) 
        High-energy "Battle Ropes" / Discipline visual.
      */}
      <div className="absolute inset-0 z-0">
        <img
           src={heroBg}
           alt="Background"
           className="w-full h-full object-cover opacity-40 select-none pointer-events-none"
           style={{ filter: "grayscale(100%) contrast(1.1)" }}
        />
        {/* Gradient Overlay for text readability */}
        <div className="absolute inset-0 bg-background/60 backdrop-blur-[1px]" />
      </div>

      {/* 
        THE MONOLITH BACKGROUND 
        Massive typography that spans the viewport.
      */}


      {/* 
        NOISE TEXTURE OVERLAY 
      */}
      <div className="absolute inset-0 z-[1] opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-repeat" />

      {/* 
        CONTENT CORE 
      */}
      <motion.div 
        style={{ y: yText, opacity: opacityText, scale: scaleText }}
        className="relative z-10 flex flex-col items-center gap-8 max-w-4xl text-center"
      >
        {/* Eyebrow / Status */}
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
            className="flex items-center gap-3 px-4 py-2 rounded-full border border-primary/20 bg-primary/5 backdrop-blur-sm"
        >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <span className="text-[10px] font-bold tracking-[0.2em] text-primary uppercase">
                O Novo Padrão de Performance
            </span>
        </motion.div>

        {/* Main Headline - Brutal & Sharp */}
        <h1 className="flex flex-col items-center w-full max-w-full overflow-hidden">
          <motion.span 
            initial={{ opacity: 0, y: 40, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
            className="text-[12vw] sm:text-7xl md:text-8xl lg:text-9xl font-extrabold tracking-tighter text-foreground leading-[0.9]"
          >
            DISCIPLINA
          </motion.span>
          <motion.span 
            initial={{ opacity: 0, y: 40, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.45 }}
            className="text-[12vw] sm:text-7xl md:text-8xl lg:text-9xl font-extrabold tracking-tighter text-muted-foreground/40 leading-[0.9] italic"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            ACIMA DE
          </motion.span>
          <motion.span 
            initial={{ opacity: 0, y: 40, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.6 }}
            className="text-[12vw] sm:text-7xl md:text-8xl lg:text-9xl font-extrabold tracking-tighter text-foreground leading-[0.9]"
          >
            TALENTO.
          </motion.span>
        </h1>

        {/* Subtext */}
        <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.5, delay: 0.8 }}
            className="text-base sm:text-lg text-muted-foreground font-light max-w-lg leading-relaxed"
        >
            A excelência não negocia preço.<br className="hidden sm:block"/>
            A única saída é através.
        </motion.p>

        {/* 
            REMOVED: "Junte-se à Forja" Button.
            User Feedback: "Button here... doesn't function for anything... remove it".
            Action: Cleaned up interface. Focus is on Manifesto scroll or Topbar CTA.
        */}
      </motion.div>

      {/* Scroll Indicator */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 1 }}
        className="absolute bottom-10 flex flex-col items-center gap-2 opacity-50 mix-blend-difference"
      >
        <div className="w-[1px] h-16 bg-gradient-to-b from-transparent via-foreground to-transparent animate-pulse" />
      </motion.div>
    </section>
  );
}
