import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { LazyMotion, domAnimation, m } from "framer-motion";
import {
  LayoutDashboard,
  LogOut,
  Menu,
  X,
  User,
  Route,
  CheckSquare,
  Calendar,
  BarChart3,
  Megaphone,
  FileDown,
  Star,
  BookOpen,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { NotificationBell } from "@/components/NotificationBell";
import { useTheme } from "@/hooks/useTheme";
import { useClientPermissions } from "@/hooks/useClientPermissions";
import logoRoxo from "@/assets/logo-linkou-horizontal-roxo.png";
import logoBranca from "@/assets/logo-linkou-horizontal-branca.png";

type PermissionKey = "canViewFinancials";

const navItems: { href: string; icon: typeof LayoutDashboard; label: string; permission?: PermissionKey }[] = [
  { href: "/cliente", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/cliente/minha-jornada", icon: Route, label: "Minha Jornada" },
  { href: "/cliente/tarefas", icon: CheckSquare, label: "Tarefas" },
  { href: "/cliente/metricas-trafego", icon: BarChart3, label: "Métricas de Tráfego", permission: "canViewFinancials" },
  { href: "/cliente/campanhas", icon: Megaphone, label: "Campanhas" },
  { href: "/cliente/arquivos", icon: FileDown, label: "Arquivos" },
  { href: "/cliente/base-conhecimento", icon: BookOpen, label: "Base de Conhecimento" },
  { href: "/cliente/agendamentos", icon: Calendar, label: "Agendamentos" },
  { href: "/cliente/minha-conta", icon: User, label: "Minha Conta" },
];

export function ClientLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { profile, signOut } = useAuth();
  const { theme } = useTheme();
  const { userType, canViewFinancials } = useClientPermissions();
  const navigate = useNavigate();
  const location = useLocation();

  const permissions: Record<PermissionKey, boolean> = { canViewFinancials };
  const filteredNavItems = navItems.filter(
    (item) => !item.permission || permissions[item.permission]
  );

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 glass border-b">
        <div className="flex items-center justify-between h-16 px-4">
          <Link to="/cliente" className="flex items-center gap-2">
            <img 
              src={theme === "dark" ? logoBranca : logoRoxo}
              alt="Linkou"
              className="w-[120px] h-auto"
            />
          </Link>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-full w-64 bg-card border-r transform transition-transform duration-300 lg:translate-x-0",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="hidden lg:flex items-center gap-2 h-16 px-6 border-b">
            <img 
              src={theme === "dark" ? logoBranca : logoRoxo}
              alt="Linkou"
              className="w-[140px] h-auto"
            />
          </div>

          {/* User Info */}
          <div className="p-4 border-b mt-16 lg:mt-0">
            <div className="flex items-center gap-3">
              {profile?.avatar_url ? (
                <img 
                  src={profile.avatar_url} 
                  alt={profile.full_name || "Avatar"}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                  <User className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium truncate">
                    {profile?.full_name || "Cliente"}
                  </p>
                  {profile?.ponto_focal && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-600 text-[10px] font-medium">
                      <Star className="h-2.5 w-2.5 fill-current" />
                      Ponto Focal
                    </span>
                  )}
                  {userType === "manager" && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-medium">
                      Gestor
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {profile?.email}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {filteredNavItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setIsSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t space-y-2">
            <div className="hidden lg:flex items-center gap-2">
              <NotificationBell />
              <ThemeToggle />
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
              onClick={handleSignOut}
            >
              <LogOut className="h-5 w-5" />
              Sair
            </Button>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="lg:ml-64 pt-16 lg:pt-0 min-h-screen">
        <LazyMotion features={domAnimation}>
          <m.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="p-3 sm:p-4 md:p-6"
          >
            <Outlet />
          </m.div>
        </LazyMotion>
      </main>
    </div>
  );
}
