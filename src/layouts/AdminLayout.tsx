import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { LazyMotion, domAnimation, m } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  LogOut,
  Menu,
  X,
  User,
  Shield,
  UserPlus,
  CheckSquare,
  Calendar,
  FileText,
  UsersRound,
  ClipboardList,
  Globe,
  FolderKanban,
  Megaphone,
  MessageCircle,
  Zap,
  Presentation,
  ChevronDown,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { NotificationBell } from "@/components/NotificationBell";
import { useTheme } from "@/hooks/useTheme";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import logoRoxo from "@/assets/logo-linkou-horizontal-roxo.png";
import logoBranca from "@/assets/logo-linkou-horizontal-branca.png";

const navGroups = [
  {
    label: null,
    items: [
      { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
    ],
  },
  {
    label: "Comercial",
    items: [
      { href: "/admin/leads", icon: UserPlus, label: "Leads" },
      { href: "/admin/propostas", icon: Presentation, label: "Propostas" },
      { href: "/admin/capturas", icon: Zap, label: "Capturas" },
    ],
  },
  {
    label: "Operacional",
    items: [
      { href: "/admin/clientes", icon: Users, label: "Clientes" },
      { href: "/admin/projetos", icon: FolderKanban, label: "Projetos" },
      { href: "/admin/campanhas", icon: Megaphone, label: "Campanhas" },
      { href: "/admin/tarefas", icon: CheckSquare, label: "Tarefas" },
      { href: "/admin/agendamentos", icon: Calendar, label: "Agendamentos" },
    ],
  },
  {
    label: "Comunicação",
    items: [
      { href: "/admin/whatsapp", icon: MessageCircle, label: "WhatsApp" },
      { href: "/admin/templates", icon: FileText, label: "Templates" },
    ],
  },
  {
    label: "Configuração",
    items: [
      { href: "/admin/landing", icon: Globe, label: "Landing Page" },
      { href: "/admin/onboarding", icon: ClipboardList, label: "Onboarding" },
      { href: "/admin/usuarios", icon: UsersRound, label: "Usuários" },
    ],
  },
];

export function AdminLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { profile, isAdmin, signOut } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  // Track which groups are open - default all open
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    navGroups.forEach((g) => {
      if (g.label) initial[g.label] = true;
    });
    return initial;
  });

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 glass border-b">
        <div className="flex items-center justify-between h-16 px-4">
          <Link to="/admin" className="flex items-center gap-2">
            <img 
              src={theme === "dark" ? logoBranca : logoRoxo}
              alt="Linkou Admin"
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
            {isAdmin && (
              <span className="ml-auto px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full flex items-center gap-1">
                <Shield className="h-3 w-3" />
                Admin
              </span>
            )}
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
                <p className="text-sm font-medium truncate">
                  {profile?.full_name || "Administrador"}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {profile?.email}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navGroups.map((group, gi) => {
              // Ungrouped items (Dashboard)
              if (!group.label) {
                return group.items.map((item) => {
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
                });
              }

              // Grouped items with collapsible
              const isGroupActive = group.items.some((item) => location.pathname === item.href);
              return (
                <Collapsible
                  key={group.label}
                  open={openGroups[group.label]}
                  onOpenChange={() => toggleGroup(group.label)}
                >
                  <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2 mt-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">
                    <span className={cn(isGroupActive && "text-primary")}>{group.label}</span>
                    <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", openGroups[group.label] && "rotate-180")} />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-0.5 mt-0.5">
                    {group.items.map((item) => {
                      const isActive = location.pathname === item.href;
                      return (
                        <Link
                          key={item.href}
                          to={item.href}
                          onClick={() => setIsSidebarOpen(false)}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors pl-5",
                            isActive
                              ? "bg-primary text-primary-foreground"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted"
                          )}
                        >
                          <item.icon className="h-4 w-4" />
                          {item.label}
                        </Link>
                      );
                    })}
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </nav>

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
