import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const DEFAULT_WHATSAPP_NUMBER = "554198345701";

function useWhatsAppSettings() {
  const { data: settings } = useQuery({
    queryKey: ["landing-settings-whatsapp"],
    queryFn: async () => {
      const { data } = await supabase
        .from("landing_settings")
        .select("whatsapp_number, whatsapp_message")
        .limit(1)
        .single();
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const whatsappNumber = settings?.whatsapp_number || DEFAULT_WHATSAPP_NUMBER;
  const whatsappMessage = settings?.whatsapp_message 
    ? encodeURIComponent(settings.whatsapp_message) 
    : "";

  const whatsappUrl = `https://api.whatsapp.com/send/?phone=${whatsappNumber}${whatsappMessage ? `&text=${whatsappMessage}` : ""}&type=phone_number&app_absent=0`;

  return { whatsappUrl };
}

export function MobileWhatsAppCTA() {
  const { whatsappUrl } = useWhatsAppSettings();

  return (
    <>
      {/* Mobile - Full width bottom bar */}
      <div className="fixed bottom-4 left-4 right-4 z-50 md:hidden">
        <Button
          size="lg"
          className="w-full font-semibold shadow-lg"
          onClick={() => window.open(whatsappUrl, "_blank")}
        >
          <MessageCircle className="mr-2 h-5 w-5" />
          Falar no WhatsApp
        </Button>
      </div>

      {/* Desktop - Floating button */}
      <div className="fixed bottom-6 right-6 z-50 hidden md:block">
        <Button
          size="lg"
          className="rounded-full h-14 w-14 p-0 shadow-xl hover:scale-110 transition-transform"
          onClick={() => window.open(whatsappUrl, "_blank")}
          aria-label="Falar no WhatsApp"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      </div>
    </>
  );
}
