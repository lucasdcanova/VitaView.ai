import { Switch, Route } from "wouter";
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
import { usePerformance, webVitals } from "@/hooks/use-performance";
import { Suspense, lazy, useEffect } from "react";
import { CommandPalette } from "@/components/command-palette/command-palette";
import { ThemeProvider } from "@/hooks/use-theme";

// Lazy load components for better performance
const NotFound = lazy(() => import("@/pages/not-found"));
const AuthPage = lazy(() => import("@/pages/auth-page"));
const ForgotPasswordPage = lazy(() => import("@/pages/forgot-password"));
const Dashboard = lazy(() => import("@/pages/dashboard"));
const UploadExams = lazy(() => import("@/pages/upload-exams"));
const ExamHistory = lazy(() => import("@/pages/exam-history"));
const ExamReport = lazy(() => import("@/pages/exam-report"));
const ExamResults = lazy(() => import("@/pages/exam-results"));
const ExamResultSingle = lazy(() => import("@/pages/exam-result-single"));
const Profile = lazy(() => import("@/pages/profile"));
const DiagnosisPage = lazy(() => import("@/pages/diagnosis-page"));
const HealthTrends = lazy(() => import("@/pages/health-trends-new"));
const ExamTimeline = lazy(() => import("@/pages/exam-timeline"));
const Home = lazy(() => import("@/pages/home"));
const Agenda = lazy(() => import("@/pages/agenda"));

const SubscriptionManagement = lazy(() => import("@/pages/subscription-management"));
const AdminPanel = lazy(() => import("@/pages/admin-panel"));
const QuickSummaryPage = lazy(() => import("@/pages/quick-summary-page"));
const BulkImport = lazy(() => import("@/pages/bulk-import"));
const TermsPage = lazy(() => import("@/pages/terms-page"));
const PrivacyPage = lazy(() => import("@/pages/privacy-page"));

// Loading fallback component
const PageLoadingFallback = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-gray-600 text-sm">Carregando...</p>
    </div>
  </div>
);

function Router() {
  return (
    <Suspense fallback={<PageLoadingFallback />}>
      <Switch>
        {/* Landing Page como página inicial pública */}
        <Route path="/" component={Home} />

        {/* Área autenticada */}
        <ProtectedRoute path="/dashboard" component={Dashboard} />
        <ProtectedRoute path="/agenda" component={Agenda} />
        <ProtectedRoute path="/upload" component={UploadExams} />
        <ProtectedRoute path="/upload-exams" component={UploadExams} />
        <ProtectedRoute path="/history" component={ExamHistory} />
        <ProtectedRoute path="/exam-history" component={ExamHistory} />
        <ProtectedRoute path="/report/:id" component={ExamReport} />
        <ProtectedRoute path="/diagnosis/:id" component={DiagnosisPage} />
        <ProtectedRoute path="/results" component={ExamResults} />
        <ProtectedRoute path="/results/:id" component={ExamResultSingle} />
        <ProtectedRoute path="/health-trends" component={HealthTrends} />
        <ProtectedRoute path="/exam-timeline" component={ExamTimeline} />
        <ProtectedRoute path="/profile" component={Profile} />
        <ProtectedRoute path="/bulk-import" component={BulkImport} />

        <ProtectedRoute path="/subscription" component={SubscriptionManagement} />
        <ProtectedRoute path="/admin-panel" component={AdminPanel} />
        <ProtectedRoute path="/admin" component={AdminPanel} />

        {/* Rotas públicas */}
        <Route path="/auth" component={AuthPage} />
        <Route path="/forgot-password" component={ForgotPasswordPage} />
        <Route path="/quick-summary" component={QuickSummaryPage} />
        <Route path="/termos" component={TermsPage} />
        <Route path="/privacidade" component={PrivacyPage} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function AppWithPerformance() {
  const { measureWebVitals } = usePerformance();

  useEffect(() => {
    // Log performance metrics after initial load
    const timer = setTimeout(() => {
      webVitals.logCurrentMetrics();
      measureWebVitals();
    }, 2000);

    return () => clearTimeout(timer);
  }, [measureWebVitals]);

  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error('Global error caught:', error, errorInfo);

        // Send to error tracking service
        if (window.gtag) {
          window.gtag('event', 'exception', {
            description: error.toString(),
            fatal: false
          });
        }
      }}
    >
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ProfileProvider>
            <UploadManagerProvider>
              <SidebarProvider>
                <ThemeProvider>
                  <TooltipProvider>
                    <Toaster />
                    <Router />
                    <CommandPalette />
                  </TooltipProvider>
                </ThemeProvider>
              </SidebarProvider>
            </UploadManagerProvider>
          </ProfileProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

function App() {
  return <AppWithPerformance />;
}

export default App;
