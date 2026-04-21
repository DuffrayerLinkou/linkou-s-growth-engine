import { memo } from "react";
import { LazyMotion, domAnimation, m } from "framer-motion";
import { ArrowRight, ChevronDown } from "lucide-react";
import { AnimatedCTA } from "./AnimatedCTA";
import linkouzinhoHero from "@/assets/linkouzinho-hero.png";

const stats = [
  { value: "25-40%", label: "do orçamento de mídia é desperdiçado em campanhas mal configuradas" },
  { value: "72%", label: "das empresas não têm tracking corretamente implementado" },
  { value: "5x", label: "mais caro converter leads sem rastreabilidade clara" },
  { value: "60%", label: "das contas de ads têm problemas de atribuição que escondem o ROI real" },
];

const clipReveal = {
  hidden: { clipPath: "inset(100% 0 0 0)" },
  visible: { clipPath: "inset(0% 0 0 0)" },
};

// Pre-computed particle positions (deterministic, no re-render randomness)
const particles = [
  { top: "12%", left: "8%", size: 3, delay: "0s" },
  { top: "22%", left: "78%", size: 2, delay: "1.2s" },
  { top: "35%", left: "18%", size: 2, delay: "2.4s" },
  { top: "48%", left: "62%", size: 4, delay: "0.6s" },
  { top: "58%", left: "32%", size: 2, delay: "3.1s" },
  { top: "68%", left: "88%", size: 3, delay: "1.8s" },
  { top: "78%", left: "12%", size: 2, delay: "2.7s" },
  { top: "85%", left: "55%", size: 3, delay: "0.3s" },
  { top: "15%", left: "45%", size: 2, delay: "3.6s" },
  { top: "42%", left: "92%", size: 2, delay: "1.5s" },
  { top: "72%", left: "70%", size: 3, delay: "2.1s" },
  { top: "28%", left: "30%", size: 2, delay: "0.9s" },
];

function HeroComponent() {
  const prefersReducedMotion = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <LazyMotion features={domAnimation}>
      <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
        {/* Cosmic background — radial gradient base */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at center, hsl(270 60% 12%) 0%, hsl(265 70% 6%) 50%, hsl(260 80% 3%) 100%)",
          }}
          aria-hidden
        />

        {/* Constellation network — SVG pattern */}
        <svg
          className="absolute inset-0 w-full h-full hero-constellation pointer-events-none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
        >
          <defs>
            <pattern id="constellation" x="0" y="0" width="240" height="240" patternUnits="userSpaceOnUse">
              {/* Nodes */}
              <circle cx="20" cy="30" r="1.5" fill="hsl(var(--primary))" opacity="0.8" />
              <circle cx="120" cy="60" r="1.2" fill="hsl(var(--primary))" opacity="0.6" />
              <circle cx="200" cy="40" r="1.8" fill="hsl(var(--primary))" opacity="0.9" />
              <circle cx="60" cy="140" r="1.3" fill="hsl(var(--primary))" opacity="0.7" />
              <circle cx="180" cy="160" r="1.5" fill="hsl(var(--primary))" opacity="0.8" />
              <circle cx="100" cy="210" r="1.2" fill="hsl(var(--primary))" opacity="0.6" />
              <circle cx="220" cy="220" r="1.4" fill="hsl(var(--primary))" opacity="0.7" />
              {/* Lines connecting nodes */}
              <line x1="20" y1="30" x2="120" y2="60" stroke="hsl(var(--primary))" strokeWidth="0.4" opacity="0.25" />
              <line x1="120" y1="60" x2="200" y2="40" stroke="hsl(var(--primary))" strokeWidth="0.4" opacity="0.25" />
              <line x1="120" y1="60" x2="60" y2="140" stroke="hsl(var(--primary))" strokeWidth="0.4" opacity="0.2" />
              <line x1="60" y1="140" x2="180" y2="160" stroke="hsl(var(--primary))" strokeWidth="0.4" opacity="0.2" />
              <line x1="180" y1="160" x2="200" y2="40" stroke="hsl(var(--primary))" strokeWidth="0.4" opacity="0.15" />
              <line x1="180" y1="160" x2="220" y2="220" stroke="hsl(var(--primary))" strokeWidth="0.4" opacity="0.25" />
              <line x1="60" y1="140" x2="100" y2="210" stroke="hsl(var(--primary))" strokeWidth="0.4" opacity="0.2" />
              <line x1="100" y1="210" x2="220" y2="220" stroke="hsl(var(--primary))" strokeWidth="0.4" opacity="0.2" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#constellation)" />
        </svg>

        {/* Twinkling particles */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          {particles.map((p, i) => (
            <span
              key={i}
              className="hero-particle absolute rounded-full bg-primary"
              style={{
                top: p.top,
                left: p.left,
                width: `${p.size}px`,
                height: `${p.size}px`,
                boxShadow: `0 0 ${p.size * 3}px hsl(var(--primary) / 0.9), 0 0 ${p.size * 6}px hsl(var(--primary) / 0.4)`,
                animationDelay: p.delay,
              }}
            />
          ))}
        </div>

        {/* Vignette overlay for depth */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at center, transparent 0%, transparent 50%, hsl(260 80% 3% / 0.6) 100%)",
          }}
          aria-hidden
        />

        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-[55%_45%] items-center gap-8">
            {/* Left: Text Content */}
            <div className="max-w-2xl">
              {/* Badge */}
              <m.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, type: "spring", stiffness: 80 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/10 mb-8"
              >
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-sm font-medium text-foreground/80">
                  Auditoria · Tráfego · Produção · Design
                </span>
              </m.div>

              {/* Headline with clip-path reveal */}
              <m.div
                variants={clipReveal}
                initial="hidden"
                animate="visible"
                transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.2 }}
              >
                <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold tracking-tight mb-6 text-left">
                  <span className="text-gradient">Marketing digital</span>{" "}
                  com clareza, performance e autonomia.
                </h1>
              </m.div>

              {/* Secondary Line */}
              <m.div
                variants={clipReveal}
                initial="hidden"
                animate="visible"
                transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.4 }}
              >
                <p className="text-base md:text-lg text-foreground/80 mb-6 max-w-xl text-left">
                  A <span className="text-primary font-medium">Agência Linkou</span> oferece auditoria, consultoria, produção de mídia, gestão de tráfego e design para quem quer resultados de verdade.
                </p>
              </m.div>

              {/* CTA */}
              <m.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="flex flex-col items-start"
              >
                <AnimatedCTA
                  size="lg"
                  onClick={() => scrollToSection("#contato")}
                  className="group"
                >
                  Quero uma auditoria gratuita
                  <m.span
                    className="inline-block"
                    initial={{ x: 0 }}
                    whileHover={{ x: 4 }}
                    transition={{ type: "spring", stiffness: 400 }}
                  >
                    <ArrowRight className="h-4 w-4" />
                  </m.span>
                </AnimatedCTA>
                <span className="text-xs text-muted-foreground mt-3">
                  Primeiro passo é entender seu cenário. Sem compromisso financeiro.
                </span>
              </m.div>
            </div>

            {/* Right: Empty space for blob on desktop, hidden on mobile */}
            <div className="hidden lg:flex items-center justify-center relative min-h-[500px]">
              {/* Radial glow halo — intensified purple aura */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    "radial-gradient(circle at 50% 45%, hsl(var(--primary) / 0.45) 0%, hsl(var(--primary) / 0.15) 35%, transparent 65%)",
                }}
              />
              {/* Secondary outer glow */}
              <div
                className="absolute inset-0 pointer-events-none motion-safe:animate-[pulse_6s_ease-in-out_infinite]"
                style={{
                  background:
                    "radial-gradient(circle at 50% 45%, hsl(var(--primary) / 0.25) 0%, transparent 50%)",
                }}
              />
              {/* Ground shadow ellipse */}
              <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-[60%] h-8 rounded-[50%] bg-primary/30 blur-2xl pointer-events-none" />

              <m.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="relative z-10"
              >
                <m.img
                  src={linkouzinhoHero}
                  alt="Linkouzinho — assistente IA da Agência Linkou"
                  loading="eager"
                  // @ts-expect-error fetchpriority is a valid HTML attribute not yet in React types
                  fetchpriority="high"
                  className="w-full max-w-[560px] xl:max-w-[620px] select-none"
                  draggable={false}
                  animate={prefersReducedMotion ? undefined : { y: [0, -10, 0] }}
                  transition={prefersReducedMotion ? undefined : { duration: 4, repeat: Infinity, ease: "easeInOut" }}
                />
              </m.div>
            </div>
          </div>

          {/* Stats - grid 2x2 mobile, horizontal desktop */}
          <m.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="mt-12 pt-8 border-t border-primary/15"
          >
            {/* Mobile: 2x2 grid / Tablet (sm+): 4 cols */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:hidden">
              {stats.map((stat, index) => (
                <div
                  key={index}
                  className="px-3 py-3 flex flex-col items-center justify-center min-h-[120px]"
                >
                  <div className="text-xl sm:text-2xl font-bold text-primary mb-1">
                    {stat.value}
                  </div>
                  <div className="text-xs text-foreground/60 leading-tight text-center">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop: horizontal with separators */}
            <div className="hidden md:flex justify-start gap-0">
              {stats.map((stat, index) => (
                <div key={index} className="flex items-center">
                  <div className="text-center px-6 py-2">
                    <div className="text-3xl font-bold text-primary mb-1">
                      {stat.value}
                    </div>
                    <div className="text-sm text-foreground/60 max-w-[180px]">
                      {stat.label}
                    </div>
                  </div>
                  {index < stats.length - 1 && (
                    <div className="w-px h-12 bg-primary/20" />
                  )}
                </div>
              ))}
            </div>
          </m.div>
        </div>

        {/* Scroll indicator */}
        <m.button
          onClick={() => scrollToSection("#servicos")}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1 text-foreground/50 hover:text-primary transition-colors"
          aria-label="Rolar para baixo"
        >
          <span className="text-xs uppercase tracking-widest">Explorar</span>
          <m.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          >
            <ChevronDown className="h-5 w-5" />
          </m.div>
        </m.button>
      </section>
    </LazyMotion>
  );
}

export const Hero = memo(HeroComponent);
