import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { AnimatedCTA } from "./AnimatedCTA";

export function Hero() {
  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
      {/* Video Background */}
      <div className="absolute inset-0 overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/videos/hero-background.mp4" type="video/mp4" />
        </video>
        {/* Overlay para legibilidade */}
        <div className="absolute inset-0 bg-background/70 backdrop-blur-[2px]" />
      </div>

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
              Auditoria e Consultoria de Tráfego
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl md:text-5xl lg:text-7xl font-bold tracking-tight mb-6"
          >
            <span className="text-gradient">Auditoria e Consultoria de Tráfego</span>{" "}
            para quem quer clareza antes de investir mais.
          </motion.h1>

          {/* Secondary Line */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="text-base md:text-lg text-foreground/80 mb-4 max-w-3xl mx-auto"
          >
            A <span className="text-primary font-medium">Agência Linkou</span> ajuda construtoras, incorporadoras e concessionárias a entender, organizar e otimizar seu tráfego dentro de um <span className="text-primary font-medium">ecossistema de vendas</span> que faz sentido.
          </motion.p>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col items-center justify-center"
          >
            <AnimatedCTA
              size="lg"
              onClick={() => scrollToSection("#contato")}
              className="group"
            >
              Quero uma auditoria gratuita
              <motion.span
                className="inline-block"
                initial={{ x: 0 }}
                whileHover={{ x: 4 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <ArrowRight className="h-4 w-4" />
              </motion.span>
            </AnimatedCTA>
            <span className="text-xs text-muted-foreground mt-3">
              Primeiro passo é entender seu cenário. Sem compromisso financeiro.
            </span>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 pt-16 border-t"
          >
            {[
              { value: "25-40%", label: "do orçamento de mídia é desperdiçado em campanhas mal configuradas" },
              { value: "72%", label: "das empresas não têm tracking corretamente implementado" },
              { value: "5x", label: "mais caro converter leads sem rastreabilidade clara" },
              { value: "60%", label: "das contas de ads têm problemas de atribuição que escondem o ROI real" },
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
