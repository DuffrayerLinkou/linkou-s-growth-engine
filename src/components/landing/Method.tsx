import { useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { Search, Layers, Compass, Rocket } from "lucide-react";
import { RevealText } from "./RevealText";

const phases = [
  {
    icon: Search,
    phase: "01",
    title: "Auditoria Inicial",
    description:
      "Analisamos suas contas, funis e dados. Identificamos vazamentos, oportunidades rápidas e o que precisa de estrutura antes de escalar.",
    details: ["Análise de contas de anúncios", "Mapeamento de funil", "Identificação de quick wins"],
  },
  {
    icon: Layers,
    phase: "02",
    title: "Organização do Ecossistema",
    description:
      "Corrigimos tracking, conectamos dados e criamos dashboards claros. Você passa a enxergar o que antes era invisível.",
    details: ["Setup técnico completo", "Integração de ferramentas", "Criação de dashboards"],
  },
  {
    icon: Compass,
    phase: "03",
    title: "Consultoria Ativa",
    description:
      "Acompanhamos a operação com metodologia de experimentos. Cada mudança é testada, medida e documentada.",
    details: ["Campanhas otimizadas", "Experimentos A/B", "Reuniões de acompanhamento"],
  },
  {
    icon: Rocket,
    phase: "04",
    title: "Autonomia do Time",
    description:
      "Treinamos seu ponto focal para dominar o sistema. Você ganha independência — não precisa mais depender de agência nenhuma.",
    details: ["Treinamento hands-on", "Documentação completa", "Suporte na transição"],
  },
];

export function Method() {
  return (
    <section id="metodo" className="bg-primary/5">
      {/* Header */}
      <div className="container mx-auto px-4 pt-20 md:pt-32 pb-12 text-center">
        <span className="text-primary font-semibold text-sm uppercase tracking-wider">
          Método Linkou de Auditoria e Consultoria
        </span>
        <RevealText
          as="h2"
          className="text-3xl md:text-4xl lg:text-5xl font-bold mt-4 mb-6 block"
        >
          Como funciona a Auditoria e Consultoria de Tráfego
        </RevealText>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Um processo estruturado em 4 fases que transforma seu marketing em um
          sistema que aprende, evolui e — no final —{" "}
          <span className="text-foreground font-medium">você controla</span>.
        </p>
      </div>

      {/* Mobile: Vertical timeline (unchanged behavior) */}
      <div className="md:hidden container mx-auto px-4 pb-20">
        <div className="space-y-0">
          {phases.map((phase, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className="flex gap-4"
            >
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/25 z-10 relative">
                  <span className="text-lg font-bold text-primary-foreground">
                    {phase.phase}
                  </span>
                </div>
                {index < phases.length - 1 && (
                  <div className="w-px flex-1 min-h-[40px] bg-border" />
                )}
              </div>
              <div className="pb-8 flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <phase.icon className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-bold">{phase.title}</h3>
                </div>
                <p className="text-muted-foreground text-sm mb-4">
                  {phase.description}
                </p>
                <ul className="space-y-2">
                  {phase.details.map((detail, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                      <span className="text-muted-foreground">{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Desktop+: Sticky scroll narrative */}
      <StickyMethodNarrative />
    </section>
  );
}

function StickyMethodNarrative() {
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Map scroll progress to active phase index (0-3)
  const activeIndex = useTransform(
    scrollYProgress,
    [0, 0.25, 0.5, 0.75, 1],
    [0, 1, 2, 3, 3]
  );

  return (
    <div
      ref={containerRef}
      className="hidden md:block relative"
      style={{ height: `${phases.length * 100}vh` }}
    >
      <div className="sticky top-0 h-screen flex items-center overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-[1fr_1.2fr] gap-12 lg:gap-20 items-center">
            {/* LEFT: Sticky steps list */}
            <div className="space-y-6 lg:space-y-8">
              <span className="text-primary font-semibold text-xs uppercase tracking-[0.3em]">
                As 4 fases
              </span>
              {phases.map((phase, index) => (
                <PhaseListItem
                  key={index}
                  phase={phase}
                  index={index}
                  activeIndex={activeIndex}
                />
              ))}
            </div>

            {/* RIGHT: Active phase card */}
            <div className="relative h-[480px] lg:h-[520px]">
              {phases.map((phase, index) => (
                <PhaseDetailCard
                  key={index}
                  phase={phase}
                  index={index}
                  activeIndex={activeIndex}
                  prefersReducedMotion={!!prefersReducedMotion}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface PhaseListItemProps {
  phase: typeof phases[0];
  index: number;
  activeIndex: ReturnType<typeof useTransform<number, number>>;
}

function PhaseListItem({ phase, index, activeIndex }: PhaseListItemProps) {
  // Active when scroll reaches this phase
  const opacity = useTransform(activeIndex, (v) => {
    const distance = Math.abs(v - index);
    if (distance < 0.5) return 1;
    if (distance < 1.5) return 0.4;
    return 0.25;
  });

  const scale = useTransform(activeIndex, (v) => {
    const distance = Math.abs(v - index);
    return distance < 0.5 ? 1 : 0.95;
  });

  return (
    <motion.div
      style={{ opacity, scale }}
      className="flex items-baseline gap-4 origin-left transition-colors"
    >
      <span className="text-3xl lg:text-4xl font-bold text-primary/40 tabular-nums shrink-0">
        {phase.phase}
      </span>
      <h3 className="text-xl lg:text-2xl font-bold text-foreground">
        {phase.title}
      </h3>
    </motion.div>
  );
}

interface PhaseDetailCardProps {
  phase: typeof phases[0];
  index: number;
  activeIndex: ReturnType<typeof useTransform<number, number>>;
  prefersReducedMotion: boolean;
}

function PhaseDetailCard({
  phase,
  index,
  activeIndex,
  prefersReducedMotion,
}: PhaseDetailCardProps) {
  const opacity = useTransform(activeIndex, (v) => {
    const distance = Math.abs(v - index);
    return distance < 0.5 ? 1 : 0;
  });

  const y = useTransform(activeIndex, (v) => {
    if (prefersReducedMotion) return 0;
    const distance = v - index;
    if (Math.abs(distance) < 0.5) return 0;
    return distance > 0 ? -40 : 40;
  });

  const Icon = phase.icon;

  return (
    <motion.div
      style={{ opacity, y }}
      className="absolute inset-0 bg-card border border-border rounded-3xl p-8 lg:p-10 shadow-xl card-gradient-border card-glow flex flex-col justify-between"
      aria-hidden={false}
    >
      <div>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Icon className="h-7 w-7 text-primary" />
          </div>
          <span className="text-5xl lg:text-6xl font-bold text-primary/20 tabular-nums">
            {phase.phase}
          </span>
        </div>

        <h3 className="text-2xl lg:text-3xl font-bold mb-4 text-foreground">
          {phase.title}
        </h3>

        <p className="text-muted-foreground text-base lg:text-lg mb-8 leading-relaxed">
          {phase.description}
        </p>
      </div>

      <ul className="space-y-3 border-t border-border pt-6">
        {phase.details.map((detail, i) => (
          <li key={i} className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
            <span className="text-foreground/80">{detail}</span>
          </li>
        ))}
      </ul>
    </motion.div>
  );
}