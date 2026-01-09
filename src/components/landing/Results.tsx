import { motion } from "framer-motion";
import { TrendingUp, Target, DollarSign, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const results = [
  {
    icon: TrendingUp,
    metric: "+312%",
    title: "Aumento em Leads Qualificados",
    description: "Construtora no interior de SP multiplicou leads em 4 meses",
    color: "text-primary",
  },
  {
    icon: DollarSign,
    metric: "R$ 1.2M",
    title: "Em Vendas Atribuídas",
    description: "Imobiliária de alto padrão com tracking completo de conversão",
    color: "text-success",
  },
  {
    icon: Target,
    metric: "-42%",
    title: "Redução no Custo por Lead",
    description: "Otimização contínua com metodologia de experimentos",
    color: "text-chart-3",
  },
  {
    icon: Users,
    metric: "8x",
    title: "Retorno Sobre Investimento",
    description: "Negócio B2B com ciclo de vendas longo e alto ticket",
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
            Números que falam por si
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Cada cliente é único, mas o método é consistente. Veja exemplos do que 
            nossos ecossistemas podem gerar.
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
              <Card className="h-full hover:shadow-lg transition-shadow border-border/50 bg-card/50 backdrop-blur-sm">
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
          * Resultados ilustrativos baseados em cases reais. Cada negócio tem seu contexto único.
        </motion.p>
      </div>
    </section>
  );
}
