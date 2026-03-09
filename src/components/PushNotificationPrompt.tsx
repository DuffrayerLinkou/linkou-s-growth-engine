import { useState } from "react";
import { Bell, BellOff, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useAuth } from "@/hooks/useAuth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";

const DISMISS_KEY = "linkou-push-dismiss";
const DISMISS_DAYS = 7;

function isDismissed(): boolean {
  const raw = localStorage.getItem(DISMISS_KEY);
  if (!raw) return false;
  const ts = parseInt(raw, 10);
  if (Date.now() - ts < DISMISS_DAYS * 86400000) return true;
  localStorage.removeItem(DISMISS_KEY);
  return false;
}

export function PushNotificationPrompt() {
  const { user } = useAuth();
  const {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    subscribe,
    unsubscribe,
  } = usePushNotifications();

  const [dismissed, setDismissed] = useState(isDismissed);
  const [showDialog, setShowDialog] = useState(false);

  // Don't show if not supported, not logged in, already subscribed, or dismissed
  if (!isSupported || !user || isSubscribed || dismissed) return null;
  if (permission === "denied") return null;

  const handleEnable = async () => {
    const success = await subscribe();
    if (success) {
      toast.success("Notificações ativadas!");
      setShowDialog(false);
    } else {
      toast.error("Não foi possível ativar as notificações");
    }
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
    setDismissed(true);
    setShowDialog(false);
  };

  return (
    <>
      {/* Bottom banner */}
      <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md animate-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-card p-3 shadow-lg backdrop-blur-sm">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Bell className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">Ative as notificações</p>
            <p className="text-xs text-muted-foreground truncate">
              Receba atualizações importantes
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => setShowDialog(true)}
            disabled={isLoading}
            className="shrink-0"
          >
            Ativar
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

      {/* Confirmation dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Notificações Push
            </DialogTitle>
            <DialogDescription>
              Receba notificações mesmo quando o app não estiver aberto.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="flex items-start gap-3 text-sm">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                1
              </div>
              <span>Atualizações sobre suas tarefas e projetos</span>
            </div>
            <div className="flex items-start gap-3 text-sm">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                2
              </div>
              <span>Lembretes de agendamentos importantes</span>
            </div>
            <div className="flex items-start gap-3 text-sm">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                3
              </div>
              <span>Novidades e comunicados da Linkou</span>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="secondary" onClick={handleDismiss} className="flex-1">
              Agora não
            </Button>
            <Button onClick={handleEnable} disabled={isLoading} className="flex-1">
              {isLoading ? "Ativando..." : "Ativar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Toggle button for settings pages
export function PushNotificationToggle() {
  const { isSupported, permission, isSubscribed, isLoading, subscribe, unsubscribe } =
    usePushNotifications();
  const { user } = useAuth();

  if (!isSupported || !user) return null;

  const handleToggle = async () => {
    if (isSubscribed) {
      const success = await unsubscribe();
      if (success) toast.success("Notificações desativadas");
    } else {
      const success = await subscribe();
      if (success) toast.success("Notificações ativadas!");
    }
  };

  return (
    <Button
      variant={isSubscribed ? "secondary" : "default"}
      size="sm"
      onClick={handleToggle}
      disabled={isLoading || permission === "denied"}
      className="gap-2"
    >
      {isSubscribed ? (
        <>
          <BellOff className="h-4 w-4" />
          Desativar notificações
        </>
      ) : (
        <>
          <Bell className="h-4 w-4" />
          Ativar notificações
        </>
      )}
    </Button>
  );
}
