import { motion } from "framer-motion";
import { TrendingUp, Target, DollarSign, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const results = [
  {
    icon: TrendingUp,
    metric: "+312%",
    title: "Leads que o comercial consegue atender",
    description: "Construtora que achava que o problema era volume. Era qualificação. Ajustamos o funil e os leads passaram a converter.",
    color: "text-primary",
  },
  {
    icon: DollarSign,
    metric: "R$ 1.2M",
    title: "Origem de cada venda mapeada",
    description: "Incorporadora que não sabia qual canal trazia resultado. Hoje, cada venda tem rastreabilidade completa.",
    color: "text-success",
  },
  {
    icon: Target,
    metric: "-42%",
    title: "Desperdício cortado do orçamento",
    description: "Concessionária que gastava em campanhas que não geravam nada. Auditoria mostrou onde estava o buraco.",
    color: "text-chart-3",
  },
  {
    icon: Users,
    metric: "8x",
    title: "Retorno sobre o investimento em consultoria",
    description: "Negócio B2B que precisava provar ROI. Montamos o tracking do zero e documentamos cada conversão.",
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
            Resultados
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mt-4 mb-6">
            O que muda após uma auditoria bem feita
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Nossos clientes param de gastar no escuro e passam a tomar <span className="text-foreground font-medium">decisões com base em dados reais</span>. Alguns exemplos.
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
          * Resultados reais de clientes. Cada negócio tem seu contexto — esses números são exemplos, não promessas.
        </motion.p>
      </div>
    </section>
  );
}
