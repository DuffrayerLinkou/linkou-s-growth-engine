import { motion } from "framer-motion";
import { TrendingUp, Target, DollarSign, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

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
    <section id="resultados" className="py-20 md:py-32">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">
            O problema
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mt-4 mb-6">
            Por que uma auditoria de tráfego é urgente
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Esses são dados de mercado sobre os problemas mais comuns em contas de mídia paga. Se algum deles parece familiar, <span className="text-foreground font-medium">vale uma conversa</span>.
          </p>
        </motion.div>

        {/* Results Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {results.map((result, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="h-full hover:shadow-lg hover:scale-[1.02] transition-all duration-300 border-border/50 bg-card/50 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className={`w-12 h-12 rounded-xl bg-secondary flex items-center justify-center mb-4`}>
                    <result.icon className={`h-6 w-6 ${result.color}`} />
                  </div>
                  <div className={`text-3xl font-bold ${result.color} mb-2`}>
                    {result.metric}
                  </div>
                  <h3 className="font-semibold mb-2">{result.title}</h3>
                  <p className="text-sm text-muted-foreground">
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
