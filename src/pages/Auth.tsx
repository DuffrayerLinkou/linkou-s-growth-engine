import { useEffect, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, AlertCircle, MessageCircle, LogOut, Download, Share } from "lucide-react";
import { AuthForm } from "@/components/auth/AuthForm";
import { useAuth } from "@/hooks/useAuth";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export default function Auth() {
  const { user, roles, profile, isLoading, rolesLoaded, signOut } = useAuth();
  const { canInstall, showIOSPrompt, promptInstall, dismiss } = usePWAInstall();
  const [iosDialogOpen, setIosDialogOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const showInstallButton = canInstall || showIOSPrompt;
  
  // Capturar mensagem de erro passada via state
  const errorMessage = (location.state as { error?: string })?.error;

  useEffect(() => {
    // Aguardar até que as roles tenham sido carregadas
    if (!isLoading && user && rolesLoaded) {
      // Redirect based on role
      if (roles.includes("admin") || roles.includes("account_manager")) {
        navigate("/admin", { replace: true });
      } else if (profile?.client_id) {
        // Só redireciona para /cliente se tiver client_id
        navigate("/cliente", { replace: true });
      }
      // Se for client sem client_id, permanece na página de auth
    }
  }, [user, roles, profile, isLoading, rolesLoaded, navigate]);

  if (isLoading || (user && !rolesLoaded)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  // Se usuário logado mas sem client_id, mostrar tela de "conta não vinculada"
  if (user && rolesLoaded && !profile?.client_id && roles.includes("client")) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <header className="p-4">
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Voltar ao site
            </Button>
          </Link>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex items-center justify-center px-4 py-12">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-destructive" />
              </div>
              <CardTitle>Conta não vinculada</CardTitle>
              <CardDescription className="mt-2">
                Sua conta ainda não está vinculada a nenhum cliente em nossa plataforma. 
                Entre em contato com o suporte para resolver esta situação.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                className="w-full gap-2" 
                asChild
              >
                <a 
                  href="https://wa.me/5541988988054?text=Olá! Minha conta não está vinculada a um cliente. Meu email é: ${encodeURIComponent(profile?.email || user.email || '')}" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="h-4 w-4" />
                  Contatar Suporte via WhatsApp
                </a>
              </Button>
              <Button 
                variant="outline" 
                className="w-full gap-2"
                onClick={() => signOut()}
              >
                <LogOut className="h-4 w-4" />
                Sair da conta
              </Button>
            </CardContent>
            <CardFooter className="text-center text-sm text-muted-foreground">
              <p className="w-full">
                Logado como: <span className="font-medium">{profile?.email || user.email}</span>
              </p>
            </CardFooter>
          </Card>

          {/* Decorative Elements */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 overflow-hidden"
          >
            <div className="absolute top-1/4 -left-32 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          </motion.div>
        </main>

        {/* Footer */}
        <footer className="p-4 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Linkou. Todos os direitos reservados.
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="p-4 flex items-center justify-between">
        <Link to="/">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar ao site
          </Button>
        </Link>
        {showInstallButton && (
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={async () => {
              if (canInstall) {
                await promptInstall();
              } else {
                setIosDialogOpen(true);
              }
            }}
          >
            <Download className="h-4 w-4" />
            Instalar App
          </Button>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Mensagem de erro, se houver */}
          {errorMessage && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          <AuthForm />

          {/* Decorative Elements */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 overflow-hidden"
          >
            <div className="absolute top-1/4 -left-32 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-4 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Linkou. Todos os direitos reservados.
      </footer>

      {/* iOS install instructions dialog */}
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
              <span>Toque no ícone <Share className="inline h-4 w-4 text-primary -mt-0.5" /> <strong>Compartilhar</strong> na barra do Safari</span>
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
          <Button onClick={() => { dismiss(); setIosDialogOpen(false); }} variant="secondary" className="w-full">
            Entendi
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
