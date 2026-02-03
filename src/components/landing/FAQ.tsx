import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "Quais serviços a Linkou oferece?",
    answer:
      "Trabalhamos com quatro frentes principais: Auditoria e Consultoria de Tráfego (diagnóstico e setup de contas), Produção de Mídia (criativos para anúncios e conteúdo orgânico), Gestão de Tráfego Pago (operação contínua de Meta e Google Ads) e Design Digital (identidade visual, sites e landing pages).",
  },
  {
    question: "Posso contratar apenas um serviço ou preciso de todos?",
    answer:
      "Você contrata o que fizer sentido pro seu momento. Pode começar com uma auditoria para entender seu cenário, ou ir direto pra gestão de tráfego. A gente monta o escopo junto, sem pacotes engessados.",
  },
  {
    question: "Quanto custa o serviço de gestão de tráfego?",
    answer:
      "Depende do volume de investimento e complexidade da operação. A gente precisa entender seu cenário antes de passar um valor. Preencha o formulário que a gente conversa sem compromisso.",
  },
  {
    question: "Vocês trabalham com qualquer segmento?",
    answer:
      "Temos expertise maior em construtoras, incorporadoras e concessionárias, mas também atendemos e-commerces, infoprodutores e outros negócios que investem em tráfego pago. O importante é ter estrutura para receber leads.",
  },
  {
    question: "O que é o 'Ponto Focal' na consultoria?",
    answer:
      "É alguém do seu time que a gente treina pra dominar o sistema. Pode ser um analista, um coordenador, quem você escolher. A ideia é simples: quando a gente sair, você continua rodando sem precisar de agência nenhuma.",
  },
  {
    question: "Vou ter acesso total às contas e dados?",
    answer:
      "Sim, 100%. Todas as contas são criadas no seu nome. Você é dono de tudo desde o dia 1. Se a gente desaparecer amanhã, você não perde nada. Transparência total, sem letra miúda.",
  },
  {
    question: "Quanto tempo até ver resultados?",
    answer:
      "Resultados rápidos (quick wins) costumam aparecer nas primeiras semanas. Resultados sólidos e escaláveis, entre o segundo e terceiro mês. A gente não promete milagre — promete método.",
  },
  {
    question: "Como funciona a produção de criativos?",
    answer:
      "Você passa o briefing, a gente desenvolve os roteiros e peças (vídeos e imagens). Tudo é validado antes de ir pro ar. Produzimos tanto para campanhas pagas quanto para conteúdo orgânico das redes sociais.",
  },
];

export function FAQ() {
  return (
    <section id="faq" className="py-20 md:py-32 bg-primary/5">
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
            FAQ
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mt-4 mb-6">
            Perguntas frequentes sobre nossos <span className="text-primary">serviços</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Se você está considerando, provavelmente tem algumas dessas dúvidas. Aqui a gente responde <span className="text-foreground font-medium">direto</span>.
          </p>
        </motion.div>

        {/* FAQ Accordion */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="max-w-3xl mx-auto"
        >
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="bg-card border border-border rounded-xl px-6 shadow-sm data-[state=open]:shadow-lg transition-all card-gradient-border card-glow"
              >
                <AccordionTrigger className="text-left font-semibold hover:no-underline py-4">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-4">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}
