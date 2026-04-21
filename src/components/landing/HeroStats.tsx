import { memo } from "react";
import { LazyMotion, domAnimation, m } from "framer-motion";

const stats = [
  { value: "25-40%", label: "do orçamento desperdiçado" },
  { value: "72%", label: "sem tracking correto" },
  { value: "5x", label: "mais caro sem rastreio" },
  { value: "60%", label: "com atribuição quebrada" },
];

function HeroStatsComponent() {
  return (
    <LazyMotion features={domAnimation}>
      <section
        aria-label="Por que isso importa"
        className="relative py-16 md:py-24 border-t border-primary/10 bg-background"
      >
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <m.p
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5 }}
              className="text-xs uppercase tracking-widest text-primary/70 mb-8 md:mb-12"
            >
              Por que isso importa
            </m.p>

            {/* Mobile: 2x2 grid */}
            <div className="grid grid-cols-2 gap-3 md:hidden">
              {stats.map((stat, index) => (
                <div
                  key={index}
                  className="flex flex-col items-start gap-2 p-4 rounded-xl bg-primary/5 border border-primary/15 min-h-[100px]"
                >
                  <div className="text-2xl font-bold text-primary leading-none">
                    {stat.value}
                  </div>
                  <div className="text-xs text-foreground/70 leading-snug">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop: open 4-col grid, generous gap, no separators */}
            <div className="hidden md:grid grid-cols-4 gap-12 lg:gap-16">
              {stats.map((stat, index) => (
                <m.div
                  key={index}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ duration: 0.5, delay: index * 0.08 }}
                  className="flex flex-col items-start py-6 px-1"
                >
                  <div className="text-4xl lg:text-5xl font-bold text-primary mb-3 leading-none tracking-tight">
                    {stat.value}
                  </div>
                  <div className="text-sm text-foreground/60 leading-snug">
                    {stat.label}
                  </div>
                </m.div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </LazyMotion>
  );
}

export const HeroStats = memo(HeroStatsComponent);