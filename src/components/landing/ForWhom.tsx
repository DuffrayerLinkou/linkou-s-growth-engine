import { motion } from "framer-motion";
import { Building2, Home, Briefcase, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const audiences = [
  {
    icon: Building2,
    title: "Construtoras e Incorporadoras",
    description:
      "Você lança empreendimentos e investe em tráfego, mas não sabe exatamente de onde vem cada lead qualificado? A auditoria revela o caminho completo — do clique à visita.",
    benefits: [
      "Rastreabilidade por empreendimento",
      "Leads qualificados por perfil",
      "Decisões baseadas em dados, não feeling",
    ],
  },
  {
    icon: Home,
    title: "Concessionárias de Veículos",
    description:
      "Vários canais, várias campanhas, e a sensação de que o dinheiro vai embora sem controle? Organizamos seu tráfego por modelo, unidade e canal — com clareza total.",
    benefits: [
      "Campanhas organizadas por objetivo",
      "Leads distribuídos por unidade",
      "ROI claro por canal",
    ],
  },
  {
    icon: Briefcase,
    title: "Negócios que Dependem de Mídia Paga",
    description:
      "Se você gasta com tráfego todo mês e sente que deveria ter mais controle sobre os resultados — esse é exatamente o problema que resolvemos.",
    benefits: [
      "Auditoria do que está funcionando",
      "Estrutura de dados organizada",
      "Time treinado para operar",
    ],
  },
];

export function ForWhom() {
  return (
    <section id="para-quem" className="py-20 md:py-32">
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
            Para Quem
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mt-4 mb-6">
            <span className="text-primary">Auditoria e Consultoria</span> para quem depende de tráfego para vender
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Trabalhamos com negócios que investem em mídia paga e precisam de <span className="text-foreground font-medium">clareza sobre o que funciona</span>. Se você se identifica, vale conversar.
          </p>
        </motion.div>

        {/* Audiences Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {audiences.map((audience, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="h-full hover:shadow-xl hover:scale-[1.02] transition-all duration-300 border-border bg-card shadow-sm card-gradient-border card-glow">
                <CardContent className="p-6">
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <audience.icon className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{audience.title}</h3>
                  <p className="text-muted-foreground mb-6">
                    {audience.description}
                  </p>
                  <ul className="space-y-3">
                    {audience.benefits.map((benefit, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <span className="text-sm">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
