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

const Index = () => {
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
