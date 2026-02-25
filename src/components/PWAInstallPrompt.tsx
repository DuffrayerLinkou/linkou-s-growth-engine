import { useState } from "react";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { X, Download, Share } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export function PWAInstallPrompt() {
  const { canInstall, showIOSPrompt, isInstalled, promptInstall, dismiss } = usePWAInstall();
  const [iosDialogOpen, setIosDialogOpen] = useState(false);

  if (isInstalled) return null;
  if (!canInstall && !showIOSPrompt) return null;

  const handleInstall = async () => {
    if (canInstall) {
      await promptInstall();
    } else if (showIOSPrompt) {
      setIosDialogOpen(true);
    }
  };

  const handleDismiss = () => {
    dismiss();
    setIosDialogOpen(false);
  };

  return (
    <>
      {/* Bottom banner */}
      <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md animate-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-card p-3 shadow-lg backdrop-blur-sm">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Download className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">Instale o app Linkou</p>
            <p className="text-xs text-muted-foreground truncate">Acesso rápido direto da sua tela</p>
          </div>
          <Button size="sm" onClick={handleInstall} className="shrink-0">
            Instalar
          </Button>
          <button
            onClick={handleDismiss}
            className="shrink-0 rounded-md p-1 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* iOS instructions dialog */}
      <Dialog open={iosDialogOpen} onOpenChange={setIosDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Instalar no iPhone/iPad</DialogTitle>
            <DialogDescription>
              Siga os passos abaixo para adicionar o app à sua tela de início:
            </DialogDescription>
          </DialogHeader>
          <ol className="space-y-4 py-2 text-sm text-foreground">
            <li className="flex items-start gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">1</span>
              <span>
                Toque no ícone <Share className="inline h-4 w-4 text-primary -mt-0.5" /> <strong>Compartilhar</strong> na barra do Safari
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">2</span>
              <span>Role para baixo e toque em <strong>"Adicionar à Tela de Início"</strong></span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">3</span>
              <span>Confirme tocando em <strong>"Adicionar"</strong></span>
            </li>
          </ol>
          <Button onClick={handleDismiss} variant="secondary" className="w-full">
            Entendi
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
