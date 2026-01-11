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
      "Você para de se perguntar 'será que tá funcionando?' e passa a ter um diagnóstico claro: o que tá vazando, o que dá pra melhorar rápido, e onde focar energia.",
    features: [
      "Análise de contas de anúncios",
      "Revisão de funil de conversão",
      "Diagnóstico de tracking/pixel",
      "Relatório executivo",
    ],
  },
  {
    icon: BarChart3,
    title: "Gestão de Tráfego",
    description:
      "Campanhas que você entende. Relatórios que fazem sentido. Reuniões onde você participa das decisões em vez de só ouvir jargão técnico.",
    features: [
      "Meta Ads & Google Ads",
      "Criativos testados",
      "Otimização contínua",
      "Relatórios transparentes",
    ],
  },
  {
    icon: MessageSquare,
    title: "Prospecção & Vendas",
    description:
      "Seu time comercial recebe leads mais quentes e tem processos claros pra abordar. Menos tempo correndo atrás, mais tempo fechando.",
    features: [
      "Fluxos de prospecção",
      "Scripts de abordagem",
      "Integração com CRM",
      "Métricas de conversão",
    ],
  },
  {
    icon: GraduationCap,
    title: "Treinamento do Ponto Focal",
    description:
      "Uma pessoa do seu time sai dominando o sistema. Você nunca mais fica refém — nem de agência, nem de funcionário que vai embora e leva tudo na cabeça.",
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
    <section id="entregas" className="py-20 md:py-32 bg-secondary/30">
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
            O que muda na sua rotina
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Cada entrega resolve um problema concreto do seu dia a dia. <span className="text-foreground font-medium">Primeiro o que você ganha</span> — depois o detalhe técnico.
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
