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
    question: "Vocês trabalham com qual investimento mínimo em mídia?",
    answer:
      "Recomendamos R$ 10.000/mês em mídia para que os experimentos tenham volume estatístico relevante. Negócios com tickets muito altos podem operar com menos, desde que o volume de leads necessário seja compatível.",
  },
  {
    question: "O que acontece se eu quiser parar antes do prazo?",
    answer:
      "Você pode cancelar quando quiser. Tudo que foi construído — contas, dados, acessos — continua seu. Só pedimos 30 dias de aviso pra fazer uma transição organizada. Sem drama, sem briga.",
  },
  {
    question: "Vocês fazem os criativos das campanhas?",
    answer:
      "Sim, produzimos os criativos (imagens, vídeos, copies) como parte do serviço de gestão de tráfego. Trabalhamos com metodologia de testes para descobrir quais formatos performam melhor para seu público.",
  },
  {
    question: "Como funciona a metodologia de experimentos?",
    answer:
      "Cada otimização é tratada como um experimento: hipótese, teste, análise. Ao final, decidimos juntos se mantemos, iteramos ou descartamos. Isso gera um histórico de aprendizados que fica com você.",
  },
];

export function FAQ() {
  return (
    <section id="faq" className="py-20 md:py-32 bg-secondary/30">
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
            Dúvidas comuns (e respostas honestas)
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Se você tá considerando, provavelmente tem algumas dessas perguntas. Aqui a gente responde <span className="text-foreground font-medium">sem rodeio</span>.
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
                className="bg-card border border-border/50 rounded-xl px-6 data-[state=open]:shadow-md transition-shadow"
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
