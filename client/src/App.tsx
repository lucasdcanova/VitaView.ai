import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { SidebarProvider } from "@/hooks/use-sidebar";
import { ProfileProvider } from "@/hooks/use-profiles";
import { ProtectedRoute } from "@/lib/protected-route";

import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import Dashboard from "@/pages/dashboard";
import UploadExams from "@/pages/upload-exams";
import ExamHistory from "@/pages/exam-history";
import ExamReport from "@/pages/exam-report";
import ExamResults from "@/pages/exam-results";
import ExamResultSingle from "@/pages/exam-result-single";
import Profile from "@/pages/profile";
import DiagnosisPage from "@/pages/diagnosis-page";
import HealthTrends from "@/pages/health-trends-new";
import ExamTimeline from "@/pages/exam-timeline";
import Home from "@/pages/home";
import SubscriptionPlans from "@/pages/subscription-plans";
import SubscriptionManagement from "@/pages/subscription-management";
import AdminPanel from "@/pages/admin-panel";
import QuickSummaryPage from "@/pages/quick-summary-page";

function Router() {
  return (
    <Switch>
      {/* Landing Page como página inicial pública */}
      <Route path="/" component={Home} />
      
      {/* Área autenticada */}
      <ProtectedRoute path="/dashboard" component={Dashboard} />
      <ProtectedRoute path="/upload" component={UploadExams} />
      <ProtectedRoute path="/upload-exams" component={UploadExams} />
      <ProtectedRoute path="/history" component={ExamHistory} />
      <ProtectedRoute path="/exam-history" component={ExamHistory} />
      <ProtectedRoute path="/report/:id" component={ExamReport} />
      <ProtectedRoute path="/diagnosis/:id" component={DiagnosisPage} />
      <ProtectedRoute path="/results" component={ExamResults} />
      <ProtectedRoute path="/results/:id" component={ExamResultSingle} />
      <ProtectedRoute path="/health-trends" component={() => {
        const HealthTrendsSimple = React.lazy(() => import("@/pages/health-trends-simple"));
        return (
          <React.Suspense fallback={<div>Carregando...</div>}>
            <HealthTrendsSimple />
          </React.Suspense>
        );
      }} />
      <ProtectedRoute path="/exam-timeline" component={ExamTimeline} />
      <ProtectedRoute path="/profile" component={Profile} />
      <ProtectedRoute path="/subscription-plans" component={SubscriptionPlans} />
      <ProtectedRoute path="/subscription" component={SubscriptionManagement} />
      <ProtectedRoute path="/admin-panel" component={AdminPanel} />
      <ProtectedRoute path="/admin" component={AdminPanel} />
      
      {/* Rotas públicas */}
      <Route path="/auth" component={AuthPage} />
      <Route path="/quick-summary" component={QuickSummaryPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ProfileProvider>
          <SidebarProvider>
            <TooltipProvider>
              <Toaster />
              <Router />
            </TooltipProvider>
          </SidebarProvider>
        </ProfileProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
