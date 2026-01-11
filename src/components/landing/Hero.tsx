import { motion } from "framer-motion";
import { ArrowRight, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeroBackground } from "./HeroBackground";
import { useRef, useState, useCallback } from "react";

export function Hero() {
  const heroRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = heroRef.current?.getBoundingClientRect();
    if (!rect) return;
    setMousePosition({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  }, []);

  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section 
      ref={heroRef}
      onMouseMove={handleMouseMove}
      className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden"
    >
      {/* Animated Background */}
      <HeroBackground mousePosition={mousePosition} />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, type: "spring", stiffness: 100 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border bg-card/50 backdrop-blur-sm mb-8"
          >
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-sm font-medium text-muted-foreground">
              Para quem cansou de depender de agência
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl md:text-5xl lg:text-7xl font-bold tracking-tight mb-6"
          >
            Não gerenciamos contas.{" "}
            <span className="text-gradient">Criamos ecossistemas</span>{" "}
            que aprendem e evoluem.
          </motion.h1>

          {/* Secondary Line - NEW */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="text-base md:text-lg text-foreground/80 mb-4 max-w-3xl mx-auto"
          >
            Se você sente que investe em tráfego, mas não sabe de onde vem cada venda — e se preocupa em ficar na mão de terceiros — <span className="text-primary font-medium">a gente resolve isso.</span>
          </motion.p>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto"
          >
            Construímos sistemas de marketing que você entende, acompanha e, no final, <span className="font-medium text-foreground">controla</span>. Seu ponto focal sai treinado para tocar o dia a dia.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <div className="flex flex-col items-center">
              <Button
                size="lg"
                onClick={() => scrollToSection("#contato")}
                className="text-base font-semibold px-8 h-12 group"
              >
                Quero uma auditoria gratuita
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
              <span className="text-xs text-muted-foreground mt-2">
                Sem compromisso. Você sai com clareza mesmo que não avancemos.
              </span>
            </div>
            <Button
              size="lg"
              variant="outline"
              onClick={() => scrollToSection("#metodo")}
              className="text-base font-medium px-8 h-12"
            >
              <Play className="mr-2 h-4 w-4" />
              Ver como funciona
            </Button>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 pt-16 border-t"
          >
            {[
              { value: "150+", label: "negócios com tráfego organizado" },
              { value: "R$ 2M+", label: "em vendas rastreadas de ponta a ponta" },
              { value: "35%", label: "menos desperdício em mídia (média)" },
              { value: "100%", label: "de acesso — tudo é seu desde o dia 1" },
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-primary mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
