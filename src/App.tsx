import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/hooks/useTheme";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ClientLayout } from "@/layouts/ClientLayout";
import { AdminLayout } from "@/layouts/AdminLayout";
import { Skeleton } from "@/components/ui/skeleton";

// Eagerly loaded pages (critical path)
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

// Legal pages - lazy loaded
const Privacidade = lazy(() => import("./pages/Privacidade"));
const Termos = lazy(() => import("./pages/Termos"));
const Obrigado = lazy(() => import("./pages/Obrigado"));

// ============= LAZY LOADED PAGES =============
// Client pages - loaded on demand
const ClienteDashboard = lazy(() => import("./pages/cliente/Dashboard"));
const MinhaConta = lazy(() => import("./pages/cliente/MinhaConta"));
const MinhaJornada = lazy(() => import("./pages/cliente/MinhaJornada"));
const ClienteTarefas = lazy(() => import("./pages/cliente/Tarefas"));
const ClienteAgendamentos = lazy(() => import("./pages/cliente/Agendamentos"));
const ClienteMetricasTrafego = lazy(() => import("./pages/cliente/MetricasTrafego"));
const ClienteCampanhas = lazy(() => import("./pages/cliente/Campanhas"));
const ClienteArquivos = lazy(() => import("./pages/cliente/Arquivos"));
const ClienteBaseConhecimento = lazy(() => import("./pages/cliente/BaseConhecimento"));
const ClienteMinhaEquipe = lazy(() => import("./pages/cliente/MinhaEquipe"));

// Admin pages - loaded on demand
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
const AdminLeads = lazy(() => import("./pages/admin/Leads"));
const AdminClients = lazy(() => import("./pages/admin/Clients"));
const AdminClientDetail = lazy(() => import("./pages/admin/ClientDetail"));
const AdminProjects = lazy(() => import("./pages/admin/Projects"));
const AdminCampaigns = lazy(() => import("./pages/admin/Campaigns"));
const AdminUsers = lazy(() => import("./pages/admin/Users"));
const AdminTasks = lazy(() => import("./pages/admin/Tasks"));
const AdminAppointments = lazy(() => import("./pages/admin/Appointments"));
const AdminTemplates = lazy(() => import("./pages/admin/Templates"));
const AdminOnboarding = lazy(() => import("./pages/admin/Onboarding"));
const AdminLandingPage = lazy(() => import("./pages/admin/LandingPage"));
const AdminWhatsApp = lazy(() => import("./pages/admin/WhatsApp"));
const AdminCapturePages = lazy(() => import("./pages/admin/CapturePages"));
const AdminProposals = lazy(() => import("./pages/admin/Proposals"));
const AdminEmailFunnel = lazy(() => import("./pages/admin/EmailFunnel"));
const CapturePage = lazy(() => import("./pages/CapturePage"));
const CaptureThankYou = lazy(() => import("./pages/CaptureThankYou"));

// Page loading fallback component
function PageLoader() {
  return (
    <div className="p-6 space-y-4">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-48" />
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mt-6">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32 w-full rounded-lg" />
        ))}
      </div>
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 mt-4">
        <Skeleton className="h-64 w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    </div>
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (previously cacheTime)
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/privacidade" element={<Suspense fallback={<PageLoader />}><Privacidade /></Suspense>} />
              <Route path="/termos" element={<Suspense fallback={<PageLoader />}><Termos /></Suspense>} />
              <Route path="/obrigado" element={<Suspense fallback={<PageLoader />}><Obrigado /></Suspense>} />
              <Route path="/c/:slug" element={<Suspense fallback={<PageLoader />}><CapturePage /></Suspense>} />
              <Route path="/c/:slug/obrigado" element={<Suspense fallback={<PageLoader />}><CaptureThankYou /></Suspense>} />

              {/* Client routes */}
              <Route
                path="/cliente"
                element={
                  <ProtectedRoute allowedRoles={["client", "admin", "account_manager"]}>
                    <ClientLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Suspense fallback={<PageLoader />}><ClienteDashboard /></Suspense>} />
                <Route path="minha-conta" element={<Suspense fallback={<PageLoader />}><MinhaConta /></Suspense>} />
                <Route path="minha-jornada" element={<Suspense fallback={<PageLoader />}><MinhaJornada /></Suspense>} />
                <Route path="tarefas" element={<Suspense fallback={<PageLoader />}><ClienteTarefas /></Suspense>} />
                <Route path="metricas-trafego" element={<Suspense fallback={<PageLoader />}><ClienteMetricasTrafego /></Suspense>} />
                <Route path="campanhas" element={<Suspense fallback={<PageLoader />}><ClienteCampanhas /></Suspense>} />
                <Route path="arquivos" element={<Suspense fallback={<PageLoader />}><ClienteArquivos /></Suspense>} />
                <Route path="base-conhecimento" element={<Suspense fallback={<PageLoader />}><ClienteBaseConhecimento /></Suspense>} />
                <Route path="agendamentos" element={<Suspense fallback={<PageLoader />}><ClienteAgendamentos /></Suspense>} />
                <Route path="minha-equipe" element={<Suspense fallback={<PageLoader />}><ClienteMinhaEquipe /></Suspense>} />
              </Route>

              {/* Admin routes */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={["admin", "account_manager"]}>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Suspense fallback={<PageLoader />}><AdminDashboard /></Suspense>} />
                <Route path="leads" element={<Suspense fallback={<PageLoader />}><AdminLeads /></Suspense>} />
                <Route path="clientes" element={<Suspense fallback={<PageLoader />}><AdminClients /></Suspense>} />
                <Route path="clientes/:id" element={<Suspense fallback={<PageLoader />}><AdminClientDetail /></Suspense>} />
                <Route path="campanhas" element={<Suspense fallback={<PageLoader />}><AdminCampaigns /></Suspense>} />
                <Route path="onboarding" element={<Suspense fallback={<PageLoader />}><AdminOnboarding /></Suspense>} />
                <Route path="landing" element={<Suspense fallback={<PageLoader />}><AdminLandingPage /></Suspense>} />
                <Route path="tarefas" element={<Suspense fallback={<PageLoader />}><AdminTasks /></Suspense>} />
                <Route path="agendamentos" element={<Suspense fallback={<PageLoader />}><AdminAppointments /></Suspense>} />
                <Route path="templates" element={<Suspense fallback={<PageLoader />}><AdminTemplates /></Suspense>} />
                <Route path="projetos" element={<Suspense fallback={<PageLoader />}><AdminProjects /></Suspense>} />
                <Route path="usuarios" element={<Suspense fallback={<PageLoader />}><AdminUsers /></Suspense>} />
                <Route path="whatsapp" element={<Suspense fallback={<PageLoader />}><AdminWhatsApp /></Suspense>} />
                <Route path="capturas" element={<Suspense fallback={<PageLoader />}><AdminCapturePages /></Suspense>} />
                <Route path="propostas" element={<Suspense fallback={<PageLoader />}><AdminProposals /></Suspense>} />
                <Route path="funil-email" element={<Suspense fallback={<PageLoader />}><AdminEmailFunnel /></Suspense>} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </TooltipProvider>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;