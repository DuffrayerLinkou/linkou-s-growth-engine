import { motion } from "framer-motion";
import { Building2, Home, Briefcase, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const audiences = [
  {
    icon: Building2,
    title: "Construtoras e Incorporadoras",
    description:
      "Lançamentos imobiliários precisam de estratégias de tráfego que acompanhem o ciclo de vendas.",
    benefits: [
      "Captação qualificada de leads",
      "Tracking completo até a venda",
      "Otimização contínua do funil",
    ],
  },
  {
    icon: Home,
    title: "Imobiliárias",
    description:
      "Corretores precisam de leads aquecidos e um sistema que trabalhe enquanto eles vendem.",
    benefits: [
      "Leads prontos para atendimento",
      "Segmentação por perfil de imóvel",
      "Integração com seu CRM",
    ],
  },
  {
    icon: Briefcase,
    title: "Negócios com Venda Consultiva",
    description:
      "B2B, serviços de alto ticket, projetos sob medida — quem precisa educar antes de vender.",
    benefits: [
      "Nutrição automatizada",
      "Prospecção ativa estruturada",
      "Atribuição de resultados",
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
            Criamos ecossistemas para quem leva vendas a sério
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Nosso método funciona melhor para negócios com tickets médios a altos 
            e ciclos de vendas que exigem relacionamento.
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
              <Card className="h-full hover:shadow-lg transition-shadow border-border/50 bg-card/50 backdrop-blur-sm">
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
