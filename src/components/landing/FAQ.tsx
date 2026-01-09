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
      "O Ponto Focal é uma pessoa do seu time que treinamos para dominar todo o sistema de marketing e vendas que construímos. Essa pessoa será capaz de operar, analisar e otimizar as campanhas com autonomia. É assim que garantimos que você nunca fique refém de agência.",
  },
  {
    question: "Vou ter acesso total às contas e dados?",
    answer:
      "Sim, 100%. Todas as contas de anúncios, ferramentas e dashboards são criados em nome da sua empresa. Você é dono de tudo desde o primeiro dia. Trabalhamos com total transparência — você acompanha cada centavo investido e cada resultado gerado.",
  },
  {
    question: "Qual o prazo mínimo de contrato?",
    answer:
      "Trabalhamos com contratos de 6 meses, que é o tempo mínimo para implementar as 4 fases do nosso método e transferir o conhecimento para seu time. Após esse período, você pode continuar em modelo de mentoria ou seguir 100% independente.",
  },
  {
    question: "Quanto tempo até ver resultados?",
    answer:
      "Resultados iniciais (quick wins) costumam aparecer nas primeiras semanas. Resultados consistentes e escaláveis geralmente surgem entre o segundo e terceiro mês, quando o ecossistema começa a 'aprender' com os dados acumulados.",
  },
  {
    question: "Vocês trabalham com qual investimento mínimo em mídia?",
    answer:
      "Recomendamos um investimento mínimo de R$ 10.000/mês em mídia para que os experimentos tenham volume estatístico relevante. Negócios com tickets muito altos podem operar com menos, desde que o volume de leads necessário seja compatível.",
  },
  {
    question: "O que acontece se eu quiser parar antes do prazo?",
    answer:
      "Você pode cancelar a qualquer momento. Todas as contas, dados e acessos permanecem com você. A única coisa que pedimos é um aviso prévio de 30 dias para uma transição organizada e transferência de conhecimento.",
  },
  {
    question: "Vocês fazem os criativos das campanhas?",
    answer:
      "Sim, produzimos os criativos (imagens, vídeos, copies) como parte do serviço de gestão de tráfego. Trabalhamos com metodologia de testes para descobrir quais formatos performam melhor para seu público específico.",
  },
  {
    question: "Como funciona a metodologia de experimentos?",
    answer:
      "Cada otimização é tratada como um experimento científico: definimos hipótese, variação, métrica-alvo e prazo. Ao final, analisamos o resultado e decidimos juntos se mantemos, iteramos ou descartamos. Isso gera um histórico de aprendizados valiosos.",
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
            Perguntas frequentes
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Tire suas dúvidas sobre como trabalhamos e o que você pode esperar.
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
