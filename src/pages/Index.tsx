import { useEffect } from "react";
import { Header } from "@/components/landing/Header";
import { Hero } from "@/components/landing/Hero";
import { TrackingScripts } from "@/components/TrackingScripts";
import { Services } from "@/components/landing/Services";
import { Results } from "@/components/landing/Results";
import { Method } from "@/components/landing/Method";
import { ForWhom } from "@/components/landing/ForWhom";
import { Testimonials } from "@/components/landing/Testimonials";
import { FAQ } from "@/components/landing/FAQ";
import { ContactForm } from "@/components/landing/ContactForm";
import { Footer } from "@/components/landing/Footer";
import { MobileWhatsAppCTA } from "@/components/landing/MobileWhatsAppCTA";

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  "name": "Agência Linkou",
  "description": "Não gerenciamos contas. Criamos ecossistemas de tráfego e vendas que aprendem e evoluem. Treinamos seu ponto focal para assumir.",
  "url": "https://linkou-ecosystem-builder.lovable.app",
  "image": "https://linkou-ecosystem-builder.lovable.app/og-image.png",
  "serviceType": [
    "Auditoria de Tráfego Pago",
    "Gestão de Tráfego Pago",
    "Consultoria de Performance",
    "Ecossistema de Vendas Digital"
  ],
  "areaServed": {
    "@type": "Country",
    "name": "BR"
  },
  "priceRange": "$$"
};

const Index = () => {
  useEffect(() => {
    const scriptId = "json-ld-schema";
    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.type = "application/ld+json";
      script.textContent = JSON.stringify(JSON_LD);
      document.head.appendChild(script);
    }
    return () => {
      document.getElementById(scriptId)?.remove();
    };
  }, []);

  return (
    <div className="min-h-screen">
      <TrackingScripts />
      <Header />
      <main>
        <Hero />
        <Services />
        <Results />
        <Method />
        <ForWhom />
        <Testimonials />
        <FAQ />
        <ContactForm />
      </main>
      <Footer />
      <MobileWhatsAppCTA />
    </div>
  );
};

export default Index;
