import { motion } from "framer-motion";
import { Search, Layers, Compass, Rocket } from "lucide-react";

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
    <section id="metodo" className="py-20 md:py-32 bg-secondary/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">
            Método Linkou de Auditoria e Consultoria
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mt-4 mb-6">
            Como funciona a <span className="text-primary">Auditoria e Consultoria de Tráfego</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Um processo estruturado em 4 fases que transforma seu marketing em um 
            sistema que aprende, evolui e — no final — <span className="text-foreground font-medium">você controla</span>.
          </p>
        </motion.div>

        {/* Intro paragraph */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-center text-muted-foreground max-w-3xl mx-auto mb-16"
        >
          Antes de otimizar, você precisa entender o que está acontecendo. Nossa auditoria revela onde o dinheiro está indo — e nossa consultoria <span className="text-foreground font-medium">organiza o caminho pra frente</span>.
        </motion.p>

        {/* Phases */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {phases.map((phase, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="relative"
            >
              {/* Connector Line */}
              {index < phases.length - 1 && (
                <div className="hidden lg:block absolute top-12 left-full w-full h-0.5 bg-gradient-to-r from-primary/50 to-transparent -translate-x-4" />
              )}

              <div className="bg-card border border-border/50 rounded-2xl p-6 h-full hover:shadow-lg hover:scale-[1.02] transition-all duration-300">
                {/* Phase Number & Icon */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                    <phase.icon className="h-7 w-7 text-primary" />
                  </div>
                  <span className="text-4xl font-bold text-primary/20">
                    {phase.phase}
                  </span>
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold mb-3">{phase.title}</h3>
                <p className="text-muted-foreground mb-4">{phase.description}</p>

                {/* Details */}
                <ul className="space-y-2">
                  {phase.details.map((detail, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                      {detail}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
