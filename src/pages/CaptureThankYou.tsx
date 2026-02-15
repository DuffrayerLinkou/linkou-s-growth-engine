import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, Loader2, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface CapturePageData {
  headline: string;
  thank_you_message: string;
  primary_color: string;
  background_color: string;
  text_color: string;
  logo_url: string | null;
  background_image_url: string | null;
}

const CaptureThankYou = () => {
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState<CapturePageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    const fetchPage = async () => {
      const { data } = await supabase.rpc("get_capture_page_by_slug", { _slug: slug });
      if (data) {
        const d = data as unknown as Record<string, unknown>;
        setPage({
          headline: (d.headline as string) || "",
          thank_you_message: (d.thank_you_message as string) || "Obrigado! Recebemos seu contato.",
          primary_color: (d.primary_color as string) || "#7C3AED",
          background_color: (d.background_color as string) || "#1a1a2e",
          text_color: (d.text_color as string) || "#ffffff",
          logo_url: (d.logo_url as string) || null,
          background_image_url: (d.background_image_url as string) || null,
        });
        if (d.meta_title) document.title = `Obrigado — ${d.meta_title}`;
      }
      setLoading(false);
    };
    fetchPage();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!page) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <h1 className="text-2xl font-bold">Página não encontrada</h1>
        <p className="text-muted-foreground">Esta página não existe ou foi desativada.</p>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden"
      style={{
        backgroundColor: page.background_color,
        color: page.text_color,
        backgroundImage: page.background_image_url ? `url(${page.background_image_url})` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {page.background_image_url && <div className="absolute inset-0 bg-black/60 z-0" />}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, type: "spring" }}
        className="relative z-10 text-center max-w-lg space-y-8"
      >
        {page.logo_url && (
          <img src={page.logo_url} alt="Logo" className="h-12 w-auto mx-auto" />
        )}

        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        >
          <CheckCircle2
            className="h-20 w-20 mx-auto"
            style={{ color: page.primary_color }}
          />
        </motion.div>

        <h1 className="text-3xl md:text-4xl font-bold leading-tight">
          {page.thank_you_message}
        </h1>

        <p className="text-lg opacity-80">
          Nossa equipe entrará em contato em breve. Fique de olho no seu e-mail!
        </p>

        <Link
          to={`/c/${slug}`}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all hover:opacity-90"
          style={{ backgroundColor: page.primary_color, color: "#ffffff" }}
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>
      </motion.div>
    </div>
  );
};

export default CaptureThankYou;
