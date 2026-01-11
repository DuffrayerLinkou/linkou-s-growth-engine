import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const testimonials = [
  {
    name: "Carlos Mendes",
    role: "Diretor Comercial",
    company: "Construtora",
    content:
      "A gente gastava e não sabia onde estava o resultado. Depois da auditoria, ficou claro quais campanhas geravam visita e quais só queimavam verba.",
    avatar: "CM",
  },
  {
    name: "Patrícia Lima",
    role: "Gerente de Marketing",
    company: "Concessionária",
    content:
      "Tínhamos 4 unidades e nenhum controle sobre qual canal trazia o quê. Hoje, cada lead tem origem clara e o time sabe exatamente o que fazer.",
    avatar: "PL",
  },
  {
    name: "Ricardo Souza",
    role: "Sócio-Diretor",
    company: "Incorporadora",
    content:
      "O que mais valeu foi a transferência. Meu analista hoje opera o sistema sozinho. Não dependemos mais de ninguém de fora.",
    avatar: "RS",
  },
];

export function Testimonials() {
  return (
    <section className="py-20 md:py-32">
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
            Depoimentos
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mt-4 mb-6">
            O que muda após a consultoria
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Clientes que saíram do escuro e passaram a <span className="text-foreground font-medium">tomar decisões com base em dados</span>.
          </p>
        </motion.div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="h-full hover:shadow-lg hover:scale-[1.02] transition-all duration-300 border-border/50 bg-card/50 backdrop-blur-sm">
                <CardContent className="p-6">
                  {/* Quote Icon */}
                  <Quote className="h-8 w-8 text-primary/20 mb-4" />

                  {/* Stars */}
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                    ))}
                  </div>

                  {/* Content */}
                  <p className="text-muted-foreground mb-6">{testimonial.content}</p>

                  {/* Author */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-semibold text-primary">
                        {testimonial.avatar}
                      </span>
                    </div>
                    <div>
                      <div className="font-semibold text-sm">{testimonial.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {testimonial.role} · {testimonial.company}
                      </div>
                    </div>
                  </div>
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
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center text-sm text-muted-foreground mt-8"
        >
          * Depoimentos ilustrativos. Nomes e empresas são fictícios para proteção de privacidade.
        </motion.p>
      </div>
    </section>
  );
}
