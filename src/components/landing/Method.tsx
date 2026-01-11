import { motion } from "framer-motion";
import { Search, Layers, Compass, Rocket } from "lucide-react";

const phases = [
  {
    icon: Search,
    phase: "01",
    title: "Diagnóstico",
    description:
      "Antes de mexer em qualquer campanha, a gente entende onde você está. Quais são os buracos? Onde está vazando dinheiro? O que dá pra resolver rápido?",
    details: ["Análise de contas de anúncios", "Mapeamento de funil", "Identificação de quick wins"],
  },
  {
    icon: Layers,
    phase: "02",
    title: "Estruturação",
    description:
      "Montamos a base que falta. Tracking funcionando, dados conectados, dashboards que fazem sentido. Sem isso, otimizar é chutar no escuro.",
    details: ["Setup técnico completo", "Integração de ferramentas", "Criação de dashboards"],
  },
  {
    icon: Compass,
    phase: "03",
    title: "Operação Guiada",
    description:
      "Campanhas rodando, mas com método. Cada mudança é um experimento com hipótese, teste e aprendizado. Nada de 'mexer porque sim'.",
    details: ["Campanhas otimizadas", "Experimentos A/B", "Reuniões de acompanhamento"],
  },
  {
    icon: Rocket,
    phase: "04",
    title: "Transferência",
    description:
      "Seu time aprende a operar o sistema. Você ganha autonomia de verdade — não fica preso a agência nenhuma, nem a nós.",
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
            Método Linkou
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mt-4 mb-6">
            Como funciona
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
          A maioria dos negócios já investiu em tráfego. O problema não é falta de verba — <span className="text-foreground">é falta de estrutura</span>. Nosso método organiza o caos antes de otimizar.
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
