import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { SidebarProvider } from "@/hooks/use-sidebar";
import { ProfileProvider } from "@/hooks/use-profiles";
import { UploadManagerProvider } from "@/hooks/use-upload-manager";
import { ProtectedRoute } from "@/lib/protected-route";
import ErrorBoundary from "@/components/ui/error-boundary";
import { Suspense, lazy } from "react";
import { CommandPalette } from "@/components/command-palette/command-palette";
import { ThemeProvider } from "@/hooks/use-theme";
import { AuthenticatedScripts } from "@/components/authenticated-scripts";

// ============================================
// LAZY LOADED COMPONENTS - PUBLIC PAGES (sem auth)
// Carregados independentemente, sem providers pesados
// ============================================
const Home = lazy(() => import("@/pages/home"));
const TermsPage = lazy(() => import("@/pages/terms-page"));
const PrivacyPage = lazy(() => import("@/pages/privacy-page"));
const QuickSummaryPage = lazy(() => import("@/pages/quick-summary-page"));
const NotFound = lazy(() => import("@/pages/not-found"));

// ============================================
// LAZY LOADED COMPONENTS - AUTH PAGES (precisam de AuthProvider)
// ============================================
const AuthPage = lazy(() => import("@/pages/auth-page"));
const ForgotPasswordPage = lazy(() => import("@/pages/forgot-password"));

// ============================================
// LAZY LOADED COMPONENTS - AUTHENTICATED PAGES
// Carregados apenas após login
// ============================================
const UploadExams = lazy(() => import("@/pages/upload-exams"));
const ExamHistory = lazy(() => import("@/pages/exam-history"));
const ExamReport = lazy(() => import("@/pages/exam-report"));
const ExamResults = lazy(() => import("@/pages/exam-results"));
const ExamResultSingle = lazy(() => import("@/pages/exam-result-single"));
const Profile = lazy(() => import("@/pages/profile"));
const DiagnosisPage = lazy(() => import("@/pages/diagnosis-page"));
const HealthTrends = lazy(() => import("@/pages/health-trends-new"));
const PatientView = lazy(() => import("@/pages/patient-view"));
const ExamTimeline = lazy(() => import("@/pages/exam-timeline"));
const ReportsPage = lazy(() => import("@/pages/reports-page"));
const Agenda = lazy(() => import("@/pages/agenda"));
const SubscriptionManagement = lazy(() => import("@/pages/subscription-management"));
const AdminPanel = lazy(() => import("@/pages/admin-panel"));
const BulkImport = lazy(() => import("@/pages/bulk-import"));
const Patients = lazy(() => import("@/pages/patients"));

// ============================================
// LOADING FALLBACKS
// ============================================

// Loading mínimo para landing page
const LandingLoadingFallback = () => (
  <div className="min-h-screen bg-white flex items-center justify-center">
    <div className="w-6 h-6 border-2 border-gray-200 border-t-primary-600 rounded-full animate-spin"></div>
  </div>
);

// Loading para páginas do sistema
const SystemLoadingFallback = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-gray-600 text-sm">Carregando...</p>
    </div>
  </div>
);

// ============================================
// LANDING PAGE - Sem nenhum provider pesado
// ============================================
function LandingRoutes() {
  return (
    <Suspense fallback={<LandingLoadingFallback />}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/termos" component={TermsPage} />
        <Route path="/privacidade" component={PrivacyPage} />
        <Route path="/quick-summary" component={QuickSummaryPage} />
      </Switch>
    </Suspense>
  );
}

// ============================================
// AUTH ROUTES - Apenas AuthProvider (leve)
// ============================================
function AuthRoutes() {
  return (
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Suspense fallback={<LandingLoadingFallback />}>
          <Switch>
            <Route path="/auth" component={AuthPage} />
            <Route path="/forgot-password" component={ForgotPasswordPage} />
          </Switch>
        </Suspense>
      </TooltipProvider>
    </AuthProvider>
  );
}

// ============================================
// AUTHENTICATED ROUTES - Com todos os providers
// ============================================
function AuthenticatedRoutes() {
  return (
    <AuthProvider>
      <ProfileProvider>
        <UploadManagerProvider>
          <SidebarProvider>
            <ThemeProvider>
              <TooltipProvider>
                <Toaster />
                <AuthenticatedScripts />
                <Suspense fallback={<SystemLoadingFallback />}>
                  <Switch>
                    {/* Redirect /dashboard to /agenda for legacy URLs */}
                    <Route path="/dashboard">{() => { window.location.replace('/agenda'); return null; }}</Route>
                    <ProtectedRoute path="/agenda" component={Agenda} />
                    <ProtectedRoute path="/pacientes" component={Patients} />
                    <ProtectedRoute path="/upload" component={UploadExams} />
                    <ProtectedRoute path="/upload-exams" component={UploadExams} />
                    <ProtectedRoute path="/history" component={ExamHistory} />
                    <ProtectedRoute path="/exam-history" component={ExamHistory} />
                    <ProtectedRoute path="/report/:id" component={ExamReport} />
                    <ProtectedRoute path="/diagnosis/:id" component={DiagnosisPage} />
                    <ProtectedRoute path="/results" component={ExamResults} />
                    <ProtectedRoute path="/results/:id" component={ExamResultSingle} />
                    <ProtectedRoute path="/health-trends" component={HealthTrends} />
                    <ProtectedRoute path="/atendimento" component={PatientView} />
                    <ProtectedRoute path="/exam-timeline" component={ExamTimeline} />
                    <ProtectedRoute path="/profile" component={Profile} />
                    <ProtectedRoute path="/bulk-import" component={BulkImport} />
                    <ProtectedRoute path="/reports" component={ReportsPage} />
                    <ProtectedRoute path="/subscription" component={SubscriptionManagement} />
                    <ProtectedRoute path="/admin-panel" component={AdminPanel} />
                    <ProtectedRoute path="/admin" component={AdminPanel} />
                    {/* 404 para rotas autenticadas não encontradas */}
                    <Route component={NotFound} />
                  </Switch>
                </Suspense>
                <CommandPalette />
              </TooltipProvider>
            </ThemeProvider>
          </SidebarProvider>
        </UploadManagerProvider>
      </ProfileProvider>
    </AuthProvider>
  );
}

// ============================================
// MAIN ROUTER - Decide qual conjunto de rotas usar
// ============================================
function AppRouter() {
  const [location] = useLocation();

  // Rotas da landing page (sem nenhum provider)
  const landingPaths = ['/', '/termos', '/privacidade', '/quick-summary'];
  const isLandingRoute = landingPaths.some(path => location === path);

  if (isLandingRoute) {
    return <LandingRoutes />;
  }

  // Rotas de autenticação (apenas AuthProvider)
  const authPaths = ['/auth', '/forgot-password'];
  const isAuthRoute = authPaths.some(path => location === path);

  if (isAuthRoute) {
    return <AuthRoutes />;
  }

  // Rotas autenticadas com todos os providers
  return <AuthenticatedRoutes />;
}

// ============================================
// APP PRINCIPAL
// ============================================
function App() {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error('Global error caught:', error, errorInfo);
        if (window.gtag) {
          window.gtag('event', 'exception', {
            description: error.toString(),
            fatal: false
          });
        }
      }}
    >
      <QueryClientProvider client={queryClient}>
        <AppRouter />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
