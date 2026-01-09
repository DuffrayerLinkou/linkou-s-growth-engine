import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function MobileWhatsAppCTA() {
  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:hidden">
      <Button
        size="lg"
        className="w-full font-semibold shadow-lg"
        onClick={() => window.open("https://wa.me/5511999999999", "_blank")}
      >
        <MessageCircle className="mr-2 h-5 w-5" />
        Falar no WhatsApp
      </Button>
    </div>
  );
}
