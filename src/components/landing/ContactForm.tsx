import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Send, Loader2, CheckCircle2 } from "lucide-react";
import { z } from "zod";
import { AnimatedCTA } from "./AnimatedCTA";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { services } from "@/lib/services-config";

const leadSchema = z.object({
  name: z.string().trim().min(2, "Nome deve ter pelo menos 2 caracteres").max(100),
  email: z.string().trim().email("Email inválido").max(255),
  phone: z.string().trim().min(10, "Telefone inválido").max(20),
  segment: z.string().min(1, "Selecione um segmento"),
  service: z.string().optional(),
  investment: z.string().optional(),
  objective: z.string().max(1000).optional(),
});

import { landingSegments as segments, getSegmentIcon } from "@/lib/segments-config";

const investments = [
  "Até R$ 5.000/mês",
  "R$ 5.000 - R$ 15.000/mês",
  "R$ 15.000 - R$ 50.000/mês",
  "Acima de R$ 50.000/mês",
  "Ainda não invisto em mídia",
];

export function ContactForm() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    segment: "",
    service: "",
    investment: "",
    objective: "",
  });

  // Helper function to get Facebook cookies
  const getCookie = (name: string): string | undefined => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift();
    return undefined;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate form data
      const result = leadSchema.safeParse(formData);
      if (!result.success) {
        const firstError = result.error.errors[0];
        toast({
          variant: "destructive",
          title: "Erro no formulário",
          description: firstError.message,
        });
        setIsSubmitting(false);
        return;
      }

      // Insert lead into Supabase
      const { error } = await supabase.from("leads").insert({
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        segment: formData.segment,
        service_interest: formData.service || null,
        investment: formData.investment || null,
        objective: formData.objective.trim() || null,
        status: "new",
        source: "landing_page",
      });

      if (error) {
        console.error("Error inserting lead:", error);
        toast({
          variant: "destructive",
          title: "Erro ao enviar",
          description: "Tente novamente mais tarde.",
        });
        setIsSubmitting(false);
        return;
      }

      // Send event to Meta Conversions API (server-side)
      try {
        await supabase.functions.invoke('meta-capi-event', {
          body: {
            email: formData.email.trim(),
            phone: formData.phone.trim(),
            name: formData.name.trim(),
            segment: formData.segment,
            investment: formData.investment || undefined,
            source_url: window.location.href,
            fbc: getCookie('_fbc'),
            fbp: getCookie('_fbp'),
            event_name: 'Lead',
          }
        });
        
      } catch (capiError) {
        // Log silently - don't affect user experience
        console.warn('Meta CAPI event failed:', capiError);
      }

      // Send event to TikTok Events API (server-side)
      try {
        await supabase.functions.invoke('tiktok-capi-event', {
          body: {
            email: formData.email.trim(),
            phone: formData.phone.trim(),
            name: formData.name.trim(),
            segment: formData.segment,
            investment: formData.investment || undefined,
            source_url: window.location.href,
            ttclid: getCookie('ttclid'),
            ttp: getCookie('_ttp'),
            event_name: 'SubmitForm',
          }
        });
        
      } catch (tiktokError) {
        // Log silently - don't affect user experience
        console.warn('TikTok Events API event failed:', tiktokError);
      }

      // Send thank you email to lead
      try {
        await supabase.functions.invoke("notify-email", {
          body: {
            event_type: "lead_submitted",
            lead_name: formData.name.trim(),
            lead_email: formData.email.trim(),
          },
        });
      } catch (emailError) {
        console.warn("Lead thank you email failed:", emailError);
      }

      // Enroll lead in default active funnel
      try {
        await supabase.functions.invoke("notify-email", {
          body: {
            event_type: "lead_funnel_enroll",
            lead_email: formData.email.trim(),
          },
        });
      } catch (funnelError) {
        console.warn("Lead funnel enrollment failed:", funnelError);
      }

      // Redirect to thank you page
      navigate("/obrigado");
    } catch (error) {
      console.error("Error submitting form:", error);
      toast({
        variant: "destructive",
        title: "Erro ao enviar",
        description: "Tente novamente mais tarde.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <section id="contato" className="py-20 md:py-32 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto md:max-w-2xl lg:max-w-5xl">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
            {/* Left Column - Text */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <span className="text-primary font-semibold text-sm uppercase tracking-wider">
                Contato
              </span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mt-4 mb-6">
                Fale com a <span className="text-primary">Agência Linkou</span>
              </h2>
              <p className="text-muted-foreground text-lg mb-8">
                Preencha o formulário e conte o que você precisa. O primeiro passo é entender seu cenário — <span className="text-foreground font-medium">sem compromisso</span>.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold">Diagnóstico inicial gratuito</div>
                    <div className="text-sm text-muted-foreground">
                      Você recebe um panorama claro do seu cenário atual
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold">Conversa sem compromisso</div>
                    <div className="text-sm text-muted-foreground">
                      Se não fizer sentido, a gente avisa. Simples.
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold">Resposta rápida</div>
                    <div className="text-sm text-muted-foreground">
                      A gente responde em até 24h úteis
                    </div>
                  </div>
                </div>
              </div>
              {/* Emotional security phrase */}
              <div className="mt-8 p-4 bg-primary/5 border border-primary/20 rounded-xl">
                <p className="text-sm text-muted-foreground">
                  💡 <span className="text-foreground font-medium">Cada serviço é personalizado.</span> Vamos entender sua necessidade antes de propor qualquer solução.
                </p>
              </div>
            </motion.div>

            {/* Right Column - Form */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <form
                onSubmit={handleSubmit}
                className="bg-card border border-border rounded-2xl p-6 lg:p-8 space-y-5 shadow-md card-gradient-border card-glow"
              >
                <div className="space-y-2">
                  <Label htmlFor="name">Nome completo *</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Seu nome"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">WhatsApp *</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="(11) 99999-9999"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Segmento *</Label>
                    <Select
                      value={formData.segment}
                      onValueChange={(value) =>
                        setFormData({ ...formData, segment: value })
                      }
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {segments.map((seg) => {
                          const Icon = getSegmentIcon(seg);
                          return (
                            <SelectItem key={seg} value={seg}>
                              <span className="flex items-center gap-2">
                                <Icon className="h-4 w-4 text-muted-foreground" />
                                {seg}
                              </span>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Serviço de interesse</Label>
                    <Select
                      value={formData.service}
                      onValueChange={(value) =>
                        setFormData({ ...formData, service: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {services.map((service) => (
                          <SelectItem key={service.id} value={service.id}>
                            <span className="flex items-center gap-2">
                              <service.icon className="h-4 w-4 text-muted-foreground" />
                              {service.title}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Investimento em mídia</Label>
                  <Select
                    value={formData.investment}
                    onValueChange={(value) =>
                      setFormData({ ...formData, investment: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {investments.map((inv) => (
                        <SelectItem key={inv} value={inv}>
                          {inv}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="objective">Qual seu principal objetivo?</Label>
                  <Textarea
                    id="objective"
                    name="objective"
                    placeholder="Conte um pouco sobre o que você busca..."
                    value={formData.objective}
                    onChange={handleChange}
                    rows={3}
                  />
                </div>

                <AnimatedCTA
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <motion.span
                        initial={{ rotate: 0 }}
                        whileHover={{ rotate: -15, scale: 1.1 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <Send className="h-4 w-4" />
                      </motion.span>
                      Enviar mensagem
                    </>
                  )}
                </AnimatedCTA>

                <p className="text-xs text-muted-foreground text-center">
                  Seus dados estão seguros. A gente só usa pra entrar em contato.
                </p>
                <p className="text-xs text-muted-foreground text-center">
                  Ao enviar, você concorda com nossa{" "}
                  <a href="/privacidade" className="underline hover:text-foreground">
                    Política de Privacidade
                  </a>
                  .
                </p>
              </form>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
