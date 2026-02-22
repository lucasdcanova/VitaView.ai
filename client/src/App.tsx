import { Switch, Route, Redirect, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { SidebarProvider } from "@/hooks/use-sidebar";
import { ProfileProvider } from "@/hooks/use-profiles";
import { UploadManagerProvider } from "@/hooks/use-upload-manager";
import { ProtectedRoute } from "@/lib/protected-route";
import ErrorBoundary from "@/components/ui/error-boundary";
import { Suspense, useEffect } from "react";
import { CommandPalette } from "@/components/command-palette/command-palette";
import { ThemeProvider } from "@/hooks/use-theme";
import { AuthenticatedScripts } from "@/components/authenticated-scripts";
import { OnboardingTour } from "@/components/onboarding/onboarding-tour";
import { lazyWithRetry } from "@/lib/lazy-with-retry";

declare global {
  interface Window {
    gtag: (
      command: string,
      action: string,
      params?: {
        description?: string;
        fatal?: boolean;
        [key: string]: any;
      }
    ) => void;
  }
}

// ============================================
// LAZY LOADED COMPONENTS - PUBLIC PAGES (sem auth)
// Carregados independentemente, sem providers pesados
// ============================================
const Home = lazyWithRetry(() => import("@/pages/home"), "page-home");
const TermsPage = lazyWithRetry(() => import("@/pages/terms-page"), "page-terms");
const PrivacyPage = lazyWithRetry(() => import("@/pages/privacy-page"), "page-privacy");
const QuickSummaryPage = lazyWithRetry(() => import("@/pages/quick-summary-page"), "page-quick-summary");
const NotFound = lazyWithRetry(() => import("@/pages/not-found"), "page-not-found");

// ============================================
// LAZY LOADED COMPONENTS - AUTH PAGES (precisam de AuthProvider)
// ============================================
const AuthPage = lazyWithRetry(() => import("@/pages/auth-page"), "page-auth");
const ForgotPasswordPage = lazyWithRetry(() => import("@/pages/forgot-password"), "page-forgot-password");

// ============================================
// LAZY LOADED COMPONENTS - AUTHENTICATED PAGES
// Carregados apenas após login
// ============================================
const UploadExams = lazyWithRetry(() => import("@/pages/upload-exams"), "page-upload-exams");
const ExamHistory = lazyWithRetry(() => import("@/pages/exam-history"), "page-exam-history");
const ExamReport = lazyWithRetry(() => import("@/pages/exam-report"), "page-exam-report");
const ExamResults = lazyWithRetry(() => import("@/pages/exam-results"), "page-exam-results");
const ExamResultSingle = lazyWithRetry(() => import("@/pages/exam-result-single"), "page-exam-result-single");
const Profile = lazyWithRetry(() => import("@/pages/profile"), "page-profile");
const DiagnosisPage = lazyWithRetry(() => import("@/pages/diagnosis-page"), "page-diagnosis");
const HealthTrends = lazyWithRetry(() => import("@/pages/health-trends-new"), "page-health-trends");
const PatientView = lazyWithRetry(() => import("@/pages/patient-view"), "page-patient-view");
const ExamTimeline = lazyWithRetry(() => import("@/pages/exam-timeline"), "page-exam-timeline");
const ReportsPage = lazyWithRetry(() => import("@/pages/reports-page"), "page-reports");
const Agenda = lazyWithRetry(() => import("@/pages/agenda"), "page-agenda");
const SubscriptionManagement = lazyWithRetry(() => import("@/pages/subscription-management"), "page-subscription");
const AdminPanel = lazyWithRetry(() => import("@/pages/admin-panel"), "page-admin-panel");
const BulkImport = lazyWithRetry(() => import("@/pages/bulk-import"), "page-bulk-import");
const Patients = lazyWithRetry(() => import("@/pages/patients"), "page-patients");
const VitaAssist = lazyWithRetry(() => import("@/pages/vita-assist"), "page-vita-assist");
const AdminAICosts = lazyWithRetry(() => import("@/pages/admin/ai-costs"), "page-admin-ai-costs");
const KnowledgeBaseAdmin = lazyWithRetry(() => import("@/pages/admin/knowledge-base"), "page-admin-knowledge-base");
const MyClinic = lazyWithRetry(() => import("@/pages/my-clinic"), "page-my-clinic");

const isStandalonePwa = () => {
  if (typeof window === "undefined") return false;
  const navigatorWithStandalone = window.navigator as Navigator & { standalone?: boolean };

  return window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    navigatorWithStandalone.standalone === true;
};

// ...

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
  function PwaAuthAutoRedirect() {
    const { user, isLoading } = useAuth();
    const [location] = useLocation();

    if (!isStandalonePwa() || location !== "/auth" || isLoading || !user) {
      return null;
    }

    return <Redirect to="/agenda" />;
  }

  return (
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <PwaAuthAutoRedirect />
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
                    <ProtectedRoute path="/admin/knowledge-base" component={KnowledgeBaseAdmin} />
                    <ProtectedRoute path="/admin/ai-costs" component={AdminAICosts} />
                    <ProtectedRoute path="/vita-assist" component={VitaAssist} />
                    <ProtectedRoute path="/minha-clinica" component={MyClinic} />
                    {/* 404 para rotas autenticadas não encontradas */}
                    <Route component={NotFound} />
                  </Switch>
                </Suspense>
                <CommandPalette />
                <OnboardingTour />
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

  // Rotas de autenticação (apenas AuthProvider)
  const authPaths = ['/auth', '/forgot-password'];
  const isAuthRoute = authPaths.some(path => location === path);
  const shouldForceLightPublicTheme = isLandingRoute || location === "/auth";

  // Public routes must always stay in light mode regardless of saved theme.
  useEffect(() => {
    if (!shouldForceLightPublicTheme) return;

    const root = document.documentElement;
    root.classList.remove("dark", "light");
    root.classList.add("light");
    root.style.colorScheme = "light";

    document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach((meta) => {
      meta.setAttribute("content", "#FFFFFF");
    });

    const tileColorMeta = document.querySelector<HTMLMetaElement>('meta[name="msapplication-TileColor"]');
    if (tileColorMeta) {
      tileColorMeta.setAttribute("content", "#FFFFFF");
    }

    const statusBarStyleMeta = document.querySelector<HTMLMetaElement>('meta[name="apple-mobile-web-app-status-bar-style"]');
    if (statusBarStyleMeta) {
      statusBarStyleMeta.setAttribute("content", "default");
    }

    const manifestLink = document.querySelector<HTMLLinkElement>("#app-manifest") ??
      document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
    if (manifestLink) {
      manifestLink.setAttribute("href", "/manifest.json");
    }

    document.querySelectorAll<HTMLLinkElement>('link[data-theme-favicon="true"]').forEach((link) => {
      link.setAttribute("href", "/icon-192x192.png");
    });

    document.querySelectorAll<HTMLLinkElement>('link[data-theme-apple-icon="true"]').forEach((link) => {
      link.setAttribute("href", "/apple-touch-icon.png");
    });
  }, [shouldForceLightPublicTheme]);

  // No PWA (standalone), nunca abrir landing: ir para auth e deixar auth decidir
  // se redireciona para /agenda quando já autenticado.
  if (isStandalonePwa() && isLandingRoute) {
    return <Redirect to="/auth" />;
  }

  if (isLandingRoute) {
    return <LandingRoutes />;
  }

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
