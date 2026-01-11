import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import type { Database } from "@/integrations/supabase/types";
import { Loader2 } from "lucide-react";

type AppRole = Database["public"]["Enums"]["app_role"];

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: AppRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, roles, profile, isLoading, rolesLoaded } = useAuth();
  const location = useLocation();

  if (isLoading || !rolesLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Verificar se usuário está tentando acessar área de cliente sem ter client_id
  const isClientRoute = location.pathname.startsWith("/cliente");
  const hasClientAccess = profile?.client_id !== null && profile?.client_id !== undefined;
  
  if (isClientRoute && !hasClientAccess) {
    // Usuário sem client_id não pode acessar área de cliente
    if (roles.includes("admin") || roles.includes("account_manager")) {
      return <Navigate to="/admin" replace />;
    }
    // Cliente sem client_id associado - redirecionar para auth com mensagem
    return <Navigate to="/auth" state={{ error: "Seu usuário não está vinculado a nenhum cliente." }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const hasAccess = allowedRoles.some((role) => roles.includes(role));
    
    if (!hasAccess) {
      // Redirect to appropriate dashboard based on role
      if (roles.includes("admin") || roles.includes("account_manager")) {
        return <Navigate to="/admin" replace />;
      }
      if (hasClientAccess) {
        return <Navigate to="/cliente" replace />;
      }
      return <Navigate to="/auth" replace />;
    }
  }

  return <>{children}</>;
}
