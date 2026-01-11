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
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

// Client pages
import ClienteDashboard from "./pages/cliente/Dashboard";
import MinhaConta from "./pages/cliente/MinhaConta";
import MinhaJornada from "./pages/cliente/MinhaJornada";
import ClienteTarefas from "./pages/cliente/Tarefas";
import ClienteAgendamentos from "./pages/cliente/Agendamentos";
import ClienteMetricasTrafego from "./pages/cliente/MetricasTrafego";
import ClienteCampanhas from "./pages/cliente/Campanhas";
import ClienteArquivos from "./pages/cliente/Arquivos";
import ClienteBaseConhecimento from "./pages/cliente/BaseConhecimento";

// Admin pages
import AdminDashboard from "./pages/admin/Dashboard";
import AdminLeads from "./pages/admin/Leads";
import AdminClients from "./pages/admin/Clients";
import AdminClientDetail from "./pages/admin/ClientDetail";
import AdminProjects from "./pages/admin/Projects";
import AdminCampaigns from "./pages/admin/Campaigns";
import AdminUsers from "./pages/admin/Users";
import AdminTasks from "./pages/admin/Tasks";
import AdminAppointments from "./pages/admin/Appointments";
import AdminTemplates from "./pages/admin/Templates";
import AdminOnboarding from "./pages/admin/Onboarding";
import AdminLandingPage from "./pages/admin/LandingPage";

const queryClient = new QueryClient();

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

              {/* Client routes */}
              <Route
                path="/cliente"
                element={
                  <ProtectedRoute allowedRoles={["client", "admin", "account_manager"]}>
                    <ClientLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<ClienteDashboard />} />
                <Route path="minha-conta" element={<MinhaConta />} />
                <Route path="minha-jornada" element={<MinhaJornada />} />
                <Route path="tarefas" element={<ClienteTarefas />} />
                <Route path="metricas-trafego" element={<ClienteMetricasTrafego />} />
                <Route path="campanhas" element={<ClienteCampanhas />} />
                <Route path="arquivos" element={<ClienteArquivos />} />
                <Route path="base-conhecimento" element={<ClienteBaseConhecimento />} />
                <Route path="agendamentos" element={<ClienteAgendamentos />} />
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
              <Route index element={<AdminDashboard />} />
                <Route path="leads" element={<AdminLeads />} />
                <Route path="clientes" element={<AdminClients />} />
                <Route path="clientes/:id" element={<AdminClientDetail />} />
                <Route path="campanhas" element={<AdminCampaigns />} />
                <Route path="onboarding" element={<AdminOnboarding />} />
                <Route path="landing" element={<AdminLandingPage />} />
                <Route path="tarefas" element={<AdminTasks />} />
                <Route path="agendamentos" element={<AdminAppointments />} />
                <Route path="templates" element={<AdminTemplates />} />
                <Route path="projetos" element={<AdminProjects />} />
                <Route path="usuarios" element={<AdminUsers />} />
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
