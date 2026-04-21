import { motion } from "framer-motion";
import { TrendingUp, Target, DollarSign, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { RevealText } from "./RevealText";

const clipReveal = {
  hidden: { clipPath: "inset(100% 0 0 0)", opacity: 0 },
  visible: { clipPath: "inset(0% 0 0 0)", opacity: 1 },
};

const results = [
  {
    icon: DollarSign,
    metric: "26%",
    title: "do orçamento de mídia é desperdiçado em média",
    description: "Mais de 1/4 do investimento em ads vai para cliques que nunca convertem. Uma auditoria identifica onde está o vazamento.",
    color: "text-primary",
  },
  {
    icon: Target,
    metric: "65%",
    title: "das empresas não confiam nos próprios dados",
    description: "Tracking mal configurado gera métricas que não refletem a realidade. Sem dados confiáveis, toda decisão é um chute.",
    color: "text-chart-3",
  },
  {
    icon: TrendingUp,
    metric: "37%",
    title: "dos leads são perdidos por falta de atribuição",
    description: "Quando você não sabe qual canal gerou o lead, não consegue otimizar o que funciona. A origem se perde no caminho.",
    color: "text-success",
  },
  {
    icon: Users,
    metric: "3 em 4",
    title: "contas de ads têm erros de configuração básica",
    description: "Pixels quebrados, conversões duplicadas, eventos mal configurados. A maioria das contas nunca foi auditada corretamente.",
    color: "text-chart-4",
  },
];

export function Results() {
  return (
    <section id="resultados" className="py-20 md:py-32 bg-muted/50">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          variants={clipReveal}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="text-center mb-16"
        >
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">
            O problema
          </span>
          <RevealText
            as="h2"
            className="text-3xl md:text-4xl lg:text-5xl font-bold mt-4 mb-6 block"
          >
            Por que uma auditoria de tráfego é urgente
          </RevealText>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Esses são dados de mercado sobre os problemas mais comuns em contas de mídia paga. Se algum deles parece familiar, <span className="text-foreground font-medium">vale uma conversa</span>.
          </p>
        </motion.div>

        {/* Results Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {results.map((result, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              whileHover={{ y: -8, transition: { type: "spring", stiffness: 300, damping: 20 } }}
            >
              <Card className="h-full hover:shadow-xl transition-shadow duration-300 border-border bg-card shadow-sm card-gradient-border card-glow">
                <CardContent className="p-4 md:p-6">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-secondary flex items-center justify-center mb-3 md:mb-4">
                    <result.icon className={`h-5 w-5 md:h-6 md:w-6 ${result.color}`} />
                  </div>
                  <div className={`text-2xl md:text-3xl font-bold ${result.color} mb-1 md:mb-2`}>
                    {result.metric}
                  </div>
                  <h3 className="font-semibold text-sm md:text-base mb-1 md:mb-2">{result.title}</h3>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    {result.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Disclaimer */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="text-center text-sm text-muted-foreground mt-8"
        >
          * Dados baseados em benchmarks de mercado e experiência em auditorias. Cada negócio tem seu contexto.
        </motion.p>
      </div>
    </section>
  );
}
