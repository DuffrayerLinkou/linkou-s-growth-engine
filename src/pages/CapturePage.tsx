import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Send, Loader2, CheckCircle2, Sparkles } from "lucide-react";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const leadSchema = z.object({
  name: z.string().trim().min(2, "Nome deve ter pelo menos 2 caracteres").max(100),
  email: z.string().trim().email("Email inválido").max(255),
  phone: z.string().trim().min(10, "Telefone inválido").max(20),
});

interface CapturePageData {
  id: string;
  title: string;
  slug: string;
  headline: string;
  subheadline: string | null;
  benefits: string[];
  button_text: string;
  thank_you_message: string;
  thank_you_redirect_url: string | null;
  primary_color: string;
  background_color: string;
  text_color: string;
  logo_url: string | null;
  background_image_url: string | null;
  form_fields: string[];
  meta_title: string | null;
  meta_description: string | null;
  video_url: string | null;
  layout_type: string | null;
}

const extractYouTubeId = (url: string): string | null => {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/);
  return match ? match[1] : null;
};

const CapturePage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [page, setPage] = useState<CapturePageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", phone: "" });

  useEffect(() => {
    if (!slug) return;
    const fetchPage = async () => {
      const { data, error } = await supabase.rpc("get_capture_page_by_slug", { _slug: slug });

      if (error || !data) {
        setNotFound(true);
      } else {
        const pageData = data as unknown as Record<string, unknown>;
        const benefits = Array.isArray(pageData.benefits) ? (pageData.benefits as string[]) : [];
        const form_fields = Array.isArray(pageData.form_fields) ? (pageData.form_fields as string[]) : ["name", "email", "phone"];
        setPage({ ...pageData, benefits, form_fields } as unknown as CapturePageData);

        // Set meta tags
        if (pageData.meta_title) document.title = pageData.meta_title as string;
        else if (pageData.headline) document.title = pageData.headline as string;
      }
      setLoading(false);
    };
    fetchPage();
  }, [slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const result = leadSchema.safeParse(formData);
      if (!result.success) {
        toast({ variant: "destructive", title: "Erro", description: result.error.errors[0].message });
        setIsSubmitting(false);
        return;
      }

      const { error } = await supabase.from("leads").insert({
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        status: "new",
        source: `captura:${slug}`,
      });

      if (error) {
        toast({ variant: "destructive", title: "Erro ao enviar", description: "Tente novamente." });
        setIsSubmitting(false);
        return;
      }

      // CAPI events
      const getCookie = (name: string): string | undefined => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(";").shift();
        return undefined;
      };

      try {
        await supabase.functions.invoke("meta-capi-event", {
          body: {
            email: formData.email.trim(),
            phone: formData.phone.trim(),
            name: formData.name.trim(),
            source_url: window.location.href,
            fbc: getCookie("_fbc"),
            fbp: getCookie("_fbp"),
            event_name: "Lead",
          },
        });
      } catch {}

      try {
        await supabase.functions.invoke("tiktok-capi-event", {
          body: {
            email: formData.email.trim(),
            phone: formData.phone.trim(),
            name: formData.name.trim(),
            source_url: window.location.href,
            ttclid: getCookie("ttclid"),
            ttp: getCookie("_ttp"),
            event_name: "SubmitForm",
          },
        });
      } catch {}

      // Send thank you email to lead
      try {
        await supabase.functions.invoke("notify-email", {
          body: {
            event_type: "lead_submitted",
            lead_name: formData.name.trim(),
            lead_email: formData.email.trim(),
          },
        });
      } catch {}

      // Enroll lead in default active funnel
      try {
        await supabase.functions.invoke("notify-email", {
          body: {
            event_type: "lead_funnel_enroll",
            lead_email: formData.email.trim(),
          },
        });
      } catch {}

      if (page?.thank_you_redirect_url) {
        window.location.href = page.thank_you_redirect_url;
      } else {
        navigate(`/c/${slug}/obrigado`);
      }
    } catch {
      toast({ variant: "destructive", title: "Erro ao enviar", description: "Tente novamente." });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (notFound || !page) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <h1 className="text-2xl font-bold">Página não encontrada</h1>
        <p className="text-muted-foreground">Esta página de captura não existe ou foi desativada.</p>
      </div>
    );
  }

  const isVsl = page.layout_type === "vsl" && page.video_url;
  const videoId = page.video_url ? extractYouTubeId(page.video_url) : null;

  const formElement = (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
    >
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl p-6 md:p-8 space-y-5 shadow-2xl"
        style={{
          backgroundColor: "rgba(255,255,255,0.08)",
          backdropFilter: "blur(16px)",
          border: `1px solid rgba(255,255,255,0.15)`,
        }}
      >
        <div className="text-center mb-2">
          <Sparkles className="h-6 w-6 mx-auto mb-2" style={{ color: page.primary_color }} />
          <p className="font-semibold text-lg">Preencha para continuar</p>
        </div>

        {page.form_fields.includes("name") && (
          <div className="space-y-2">
            <Label htmlFor="cap-name" style={{ color: page.text_color }}>Nome completo *</Label>
            <Input id="cap-name" placeholder="Seu nome" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required className="bg-white/10 border-white/20 text-inherit placeholder:text-white/50" />
          </div>
        )}
        {page.form_fields.includes("email") && (
          <div className="space-y-2">
            <Label htmlFor="cap-email" style={{ color: page.text_color }}>E-mail *</Label>
            <Input id="cap-email" type="email" placeholder="seu@email.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required className="bg-white/10 border-white/20 text-inherit placeholder:text-white/50" />
          </div>
        )}
        {page.form_fields.includes("phone") && (
          <div className="space-y-2">
            <Label htmlFor="cap-phone" style={{ color: page.text_color }}>WhatsApp *</Label>
            <Input id="cap-phone" type="tel" placeholder="(11) 99999-9999" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} required className="bg-white/10 border-white/20 text-inherit placeholder:text-white/50" />
          </div>
        )}

        <button type="submit" disabled={isSubmitting} className="w-full py-3 px-6 rounded-xl font-semibold text-white text-lg transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2" style={{ backgroundColor: page.primary_color }}>
          {isSubmitting ? (<><Loader2 className="h-5 w-5 animate-spin" />Enviando...</>) : (<><Send className="h-5 w-5" />{page.button_text}</>)}
        </button>

        <p className="text-xs text-center opacity-60">
          Seus dados estão seguros.{" "}
          <a href="/privacidade" className="underline hover:opacity-100">Política de Privacidade</a>
        </p>
      </form>
    </motion.div>
  );

  if (isVsl && videoId) {
    // VSL Layout - vertical stack
    return (
      <div
        className="min-h-screen p-4 md:p-8 relative overflow-hidden"
        style={{
          backgroundColor: page.background_color,
          color: page.text_color,
          backgroundImage: page.background_image_url ? `url(${page.background_image_url})` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {page.background_image_url && <div className="absolute inset-0 bg-black/60 z-0" />}
        <div className="relative z-10 w-full max-w-4xl mx-auto space-y-8 py-8">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center space-y-4">
            {page.logo_url && <img src={page.logo_url} alt="Logo" className="h-10 w-auto mx-auto mb-4" />}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">{page.headline}</h1>
            {page.subheadline && <p className="text-lg opacity-80 max-w-2xl mx-auto">{page.subheadline}</p>}
          </motion.div>

          {/* Video */}
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.2 }}>
            <div className="relative w-full rounded-2xl overflow-hidden shadow-2xl" style={{ paddingBottom: "56.25%" }}>
              <iframe
                className="absolute inset-0 w-full h-full"
                src={`https://www.youtube.com/embed/${videoId}?rel=0`}
                title="Video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </motion.div>

          {/* Benefits */}
          {page.benefits.length > 0 && (
            <motion.ul initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="grid sm:grid-cols-2 gap-3 max-w-2xl mx-auto">
              {page.benefits.map((benefit, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" style={{ color: page.primary_color }} />
                  <span>{benefit}</span>
                </li>
              ))}
            </motion.ul>
          )}

          {/* Form */}
          <div className="max-w-lg mx-auto">{formElement}</div>
        </div>
      </div>
    );
  }

  // Standard Layout - side by side
  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 md:p-8 relative overflow-hidden"
      style={{
        backgroundColor: page.background_color,
        color: page.text_color,
        backgroundImage: page.background_image_url ? `url(${page.background_image_url})` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {page.background_image_url && <div className="absolute inset-0 bg-black/60 z-0" />}
      <div className="relative z-10 w-full max-w-5xl grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="space-y-6">
          {page.logo_url && <img src={page.logo_url} alt="Logo" className="h-10 w-auto mb-4" />}
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">{page.headline}</h1>
          {page.subheadline && <p className="text-lg opacity-80">{page.subheadline}</p>}
          {page.benefits.length > 0 && (
            <ul className="space-y-3">
              {page.benefits.map((benefit, i) => (
                <motion.li key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.1 }} className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" style={{ color: page.primary_color }} />
                  <span>{benefit}</span>
                </motion.li>
              ))}
            </ul>
          )}
        </motion.div>
        {formElement}
      </div>
    </div>
  );
};

export default CapturePage;
