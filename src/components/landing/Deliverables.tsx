import { motion } from "framer-motion";
import { 
  ClipboardCheck, 
  BarChart3, 
  MessageSquare, 
  GraduationCap,
  ArrowRight 
} from "lucide-react";
import { Button } from "@/components/ui/button";

const deliverables = [
  {
    icon: ClipboardCheck,
    title: "Auditoria Completa",
    description:
      "Análise detalhada das suas contas, funis e dados. Você recebe um diagnóstico claro do que está funcionando, o que não está e por onde começar.",
    features: [
      "Análise de contas de anúncios",
      "Revisão de funil de conversão",
      "Diagnóstico de tracking/pixel",
      "Relatório executivo",
    ],
  },
  {
    icon: BarChart3,
    title: "Consultoria de Tráfego",
    description:
      "Acompanhamento estratégico das campanhas. Você participa das decisões, entende o que está acontecendo e aprende junto com a operação.",
    features: [
      "Meta Ads & Google Ads",
      "Experimentos semanais",
      "Otimização contínua",
      "Relatórios transparentes",
    ],
  },
  {
    icon: MessageSquare,
    title: "Organização do Ecossistema",
    description:
      "Tracking, pixels, dashboards — tudo conectado e funcionando. Você passa a ter visibilidade real sobre o caminho do lead até a venda.",
    features: [
      "Tracking completo",
      "Dashboards claros",
      "Dados conectados",
      "Métricas de conversão",
    ],
  },
  {
    icon: GraduationCap,
    title: "Treinamento do Time",
    description:
      "Seu ponto focal sai dominando o sistema. Você não fica dependente de agência — e não perde conhecimento se alguém sair.",
    features: [
      "Treinamento hands-on",
      "Documentação completa",
      "Acesso aos dashboards",
      "Suporte na transição",
    ],
  },
];

export function Deliverables() {
  const scrollToContact = () => {
    const element = document.querySelector("#contato");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section id="entregas" className="py-20 md:py-32 bg-muted/50">
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
            O Que Entregamos
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mt-4 mb-6">
            O que você recebe com a <span className="text-primary">Auditoria e Consultoria de Tráfego</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Cada entrega foi pensada para resolver problemas concretos de quem investe em mídia e <span className="text-foreground font-medium">precisa de clareza</span>.
          </p>
        </motion.div>

        {/* Deliverables Grid */}
        <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
          {deliverables.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-card border border-border/50 rounded-2xl p-6 lg:p-8 hover:shadow-lg hover:scale-[1.01] transition-all duration-300"
            >
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <item.icon className="h-7 w-7 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                  <p className="text-muted-foreground mb-4">{item.description}</p>
                  <ul className="grid grid-cols-2 gap-2">
                    {item.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center mt-12"
        >
          <Button
            size="lg"
            onClick={scrollToContact}
            className="text-base font-semibold px-8 h-12 group"
          >
            Quero saber mais
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
