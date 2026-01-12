import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "O que é o 'Ponto Focal'?",
    answer:
      "É alguém do seu time que a gente treina pra dominar o sistema. Pode ser um analista, um coordenador, quem você escolher. A ideia é simples: quando a gente sair, você continua rodando sem precisar de agência nenhuma.",
  },
  {
    question: "Vou ter acesso total às contas e dados?",
    answer:
      "Sim, 100%. Todas as contas são criadas no seu nome. Você é dono de tudo desde o dia 1. Se a gente desaparecer amanhã, você não perde nada. Transparência total, sem letra miúda.",
  },
  {
    question: "Qual o prazo mínimo de contrato?",
    answer:
      "6 meses. Esse é o tempo pra implementar as 4 fases e transferir o conhecimento pro seu time. Depois disso, você decide: continua em mentoria, ou segue sozinho. Sem amarras.",
  },
  {
    question: "Quanto tempo até ver resultados?",
    answer:
      "Resultados rápidos (quick wins) costumam aparecer nas primeiras semanas. Resultados sólidos e escaláveis, entre o segundo e terceiro mês. A gente não promete milagre — promete método.",
  },
  {
    question: "A auditoria funciona para qualquer volume de investimento?",
    answer:
      "Sim. A auditoria funciona para qualquer volume de investimento. O importante é que você já invista em mídia e queira entender melhor o que está acontecendo. Não exigimos valor mínimo para começar a conversa.",
  },
  {
    question: "A consultoria é só para empresas grandes?",
    answer:
      "Não. Trabalhamos com negócios de diferentes tamanhos. O que importa é a necessidade de clareza e organização no tráfego. Se você investe em mídia e sente que deveria ter mais controle, a gente pode ajudar.",
  },
  {
    question: "O que acontece se eu quiser parar antes do prazo?",
    answer:
      "Você pode cancelar quando quiser. Tudo que foi construído — contas, dados, acessos — continua seu. Só pedimos 30 dias de aviso pra fazer uma transição organizada. Sem drama, sem briga.",
  },
  {
    question: "Como funciona a metodologia de experimentos?",
    answer:
      "Cada otimização é tratada como um experimento: hipótese, teste, análise. Ao final, decidimos juntos se mantemos, iteramos ou descartamos. Isso gera um histórico de aprendizados que fica com você.",
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
            Perguntas comuns sobre a <span className="text-primary">Auditoria e Consultoria</span>
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
                className="bg-card border border-border rounded-xl px-6 shadow-sm data-[state=open]:shadow-lg transition-shadow"
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
