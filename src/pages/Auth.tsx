import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { AuthForm } from "@/components/auth/AuthForm";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

export default function Auth() {
  const { user, roles, isLoading, rolesLoaded } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Aguardar até que as roles tenham sido carregadas
    if (!isLoading && user && rolesLoaded) {
      // Redirect based on role
      if (roles.includes("admin") || roles.includes("account_manager")) {
        navigate("/admin", { replace: true });
      } else {
        navigate("/cliente", { replace: true });
      }
    }
  }, [user, roles, isLoading, rolesLoaded, navigate]);

  if (isLoading || (user && !rolesLoaded)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

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
        <div className="w-full">
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
    </div>
  );
}
