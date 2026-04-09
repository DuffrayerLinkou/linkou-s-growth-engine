import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const clipReveal = {
  hidden: { clipPath: "inset(100% 0 0 0)", opacity: 0 },
  visible: { clipPath: "inset(0% 0 0 0)", opacity: 1 },
};

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
  const [current, setCurrent] = useState(0);

  const next = useCallback(() => setCurrent((c) => (c + 1) % testimonials.length), []);
  const prev = useCallback(() => setCurrent((c) => (c - 1 + testimonials.length) % testimonials.length), []);

  useEffect(() => {
    const timer = setInterval(next, 6000);
    return () => clearInterval(timer);
  }, [next]);

  return (
    <section className="py-20 md:py-32">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          variants={clipReveal}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
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

        {/* Desktop: Carousel */}
        <div className="hidden md:block relative max-w-3xl mx-auto">
          {/* Decorative quote */}
          <span className="absolute -top-8 -left-4 text-[120px] leading-none font-serif text-primary/10 select-none pointer-events-none z-0">
            "
          </span>

          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.4 }}
            >
              <Card className="shadow-sm border-border bg-card card-gradient-border card-glow relative z-10">
                <CardContent className="p-8 md:p-10">
                  <div className="flex gap-1 mb-6">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                    ))}
                  </div>

                  <p className="text-lg md:text-xl text-foreground/90 mb-8 leading-relaxed">
                    {testimonials[current].content}
                  </p>

                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-semibold text-primary">
                        {testimonials[current].avatar}
                      </span>
                    </div>
                    <div>
                      <div className="font-semibold">{testimonials[current].name}</div>
                      <div className="text-sm text-muted-foreground">
                        {testimonials[current].role} · {testimonials[current].company}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <Button variant="outline" size="icon" onClick={prev} className="rounded-full h-10 w-10">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex gap-2">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    i === current ? "bg-primary w-6" : "bg-muted-foreground/30"
                  }`}
                />
              ))}
            </div>
            <Button variant="outline" size="icon" onClick={next} className="rounded-full h-10 w-10">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Mobile: Grid */}
        <div className="md:hidden grid gap-6">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
            >
              <Card className="h-full shadow-sm hover:shadow-xl transition-shadow duration-300 border-border bg-card card-gradient-border card-glow relative">
                <span className="absolute -top-2 left-4 text-[60px] leading-none font-serif text-primary/10 select-none pointer-events-none">
                  "
                </span>
                <CardContent className="p-6 pt-8">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-6">{testimonial.content}</p>
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
