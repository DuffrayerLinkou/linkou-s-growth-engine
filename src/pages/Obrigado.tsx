import { motion } from "framer-motion";
import { CheckCircle2, Calendar, Mail, ArrowRight, Instagram, Home } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/useTheme";
import logoClaro from "@/assets/logo-linkou-horizontal-branca.png";
import logoEscuro from "@/assets/logo-linkou-horizontal-preto.png";

export default function Obrigado() {
  const { theme } = useTheme();
  const logo = theme === "dark" ? logoClaro : logoEscuro;

  const steps = [
    {
      icon: Mail,
      title: "Confirmação enviada",
      description: "Você receberá um email com os detalhes do seu contato",
    },
    {
      icon: Calendar,
      title: "Agendaremos sua auditoria",
      description: "Nossa equipe entrará em contato em até 24h úteis",
    },
    {
      icon: ArrowRight,
      title: "Prepare-se para otimizar",
      description: "Vamos analisar e apresentar oportunidades reais",
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="py-6 border-b border-border">
        <div className="container mx-auto px-4">
          <Link to="/" className="inline-block">
            <img src={logo} alt="Linkou" className="h-8" />
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center py-12 md:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            {/* Success Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="w-24 h-24 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-8"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              >
                <CheckCircle2 className="h-12 w-12 text-success" />
              </motion.div>
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4"
            >
              Recebemos seu contato!
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-lg text-muted-foreground mb-12"
            >
              Nossa equipe vai analisar suas informações e entrar em contato em até{" "}
              <span className="text-foreground font-semibold">24 horas úteis</span> para agendar sua auditoria gratuita.
            </motion.p>

            {/* Steps */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="grid md:grid-cols-3 gap-6 mb-12"
            >
              {steps.map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  className="bg-card border border-border rounded-xl p-6 text-center"
                >
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <step.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </motion.div>
              ))}
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <Button asChild size="lg" variant="default">
                <Link to="/">
                  <Home className="h-4 w-4 mr-2" />
                  Voltar para a página inicial
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a
                  href="https://instagram.com/agencialinkou"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Instagram className="h-4 w-4 mr-2" />
                  Siga no Instagram
                </a>
              </Button>
            </motion.div>

            {/* Trust Message */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.1 }}
              className="text-sm text-muted-foreground mt-12"
            >
              💡 Enquanto isso, que tal conhecer mais sobre nosso trabalho nas redes sociais?
            </motion.p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-border">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Linkou. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
