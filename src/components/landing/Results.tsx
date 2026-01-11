import { motion } from "framer-motion";
import { TrendingUp, Target, DollarSign, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const results = [
  {
    icon: TrendingUp,
    metric: "+312%",
    title: "Leads que viram reuniões",
    description: "Construtora que achava que 'tráfego não funcionava'. Em 4 meses, o comercial não dava conta de atender.",
    color: "text-primary",
  },
  {
    icon: DollarSign,
    metric: "R$ 1.2M",
    title: "Cada venda com origem clara",
    description: "Imobiliária que finalmente sabe qual campanha gerou cada cliente. Decisões baseadas em dados, não em achismo.",
    color: "text-success",
  },
  {
    icon: Target,
    metric: "-42%",
    title: "Menos dinheiro jogado fora",
    description: "Experimentos semanais mostrando o que funciona. O orçamento começou a render de verdade.",
    color: "text-chart-3",
  },
  {
    icon: Users,
    metric: "8x",
    title: "ROI que justifica a reunião",
    description: "B2B com ciclo longo. Tracking de 6 meses mostrando o caminho completo do lead até o contrato.",
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
            Histórias de quem saiu do escuro
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Antes: incerteza, números desconectados, dependência. Depois: <span className="text-foreground font-medium">clareza, controle e vendas rastreadas</span>. Alguns exemplos do que muda.
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
