import { memo } from "react";
import { LazyMotion, domAnimation, m } from "framer-motion";
import { ArrowRight, ChevronDown } from "lucide-react";
import { AnimatedCTA } from "./AnimatedCTA";

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

function HeroComponent() {
  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <LazyMotion features={domAnimation}>
      <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
        {/* Video Background */}
        <div className="absolute inset-0 overflow-hidden">
          <video
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            poster="/videos/hero-poster.jpg"
            className="absolute inset-0 w-full h-full object-cover"
          >
            <source src="/videos/hero-background.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
        </div>

        {/* Decorative blob on the right */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[45%] h-[70%] hidden lg:block pointer-events-none">
          <div className="absolute inset-0 rounded-[40%_60%_55%_45%/50%_40%_60%_50%] bg-gradient-to-br from-primary/20 via-primary/10 to-transparent blur-xl animate-[pulse_6s_ease-in-out_infinite]" />
          <div className="absolute inset-8 rounded-[50%_50%_45%_55%/45%_55%_50%_50%] bg-gradient-to-tr from-primary/15 to-accent/20 blur-lg animate-[pulse_8s_ease-in-out_infinite_1s]" />
          <div className="absolute inset-16 rounded-[45%_55%_50%_50%/55%_45%_55%_45%] border border-primary/10" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-[55%_45%] items-center gap-8">
            {/* Left: Text Content */}
            <div className="max-w-2xl">
              {/* Badge */}
              <m.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, type: "spring", stiffness: 80 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border bg-card/50 backdrop-blur-sm mb-8"
              >
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-sm font-medium text-muted-foreground">
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
            <div className="hidden lg:block" />
          </div>

          {/* Stats - horizontal with separators */}
          <m.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="flex flex-wrap justify-center lg:justify-start gap-0 mt-16 pt-12 border-t border-border/50"
          >
            {stats.map((stat, index) => (
              <div key={index} className="flex items-center">
                <div className="text-center px-4 md:px-6 py-2">
                  <div className="text-2xl md:text-3xl font-bold text-primary mb-1">
                    {stat.value}
                  </div>
                  <div className="text-xs md:text-sm text-muted-foreground max-w-[180px]">
                    {stat.label}
                  </div>
                </div>
                {index < stats.length - 1 && (
                  <div className="hidden md:block w-px h-12 bg-border/50" />
                )}
              </div>
            ))}
          </m.div>
        </div>

        {/* Scroll indicator */}
        <m.button
          onClick={() => scrollToSection("#servicos")}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
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
