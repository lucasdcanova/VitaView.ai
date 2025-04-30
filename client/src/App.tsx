import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { SidebarProvider } from "@/hooks/use-sidebar";
import { ProtectedRoute } from "@/lib/protected-route";

import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import Dashboard from "@/pages/dashboard";
import UploadExams from "@/pages/upload-exams";
import ExamHistory from "@/pages/exam-history";
import ExamReport from "@/pages/exam-report";
import ExamResults from "@/pages/exam-results";
import Profile from "@/pages/profile";
import DiagnosisPage from "@/pages/diagnosis-page";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/upload" component={UploadExams} />
      <ProtectedRoute path="/history" component={ExamHistory} />
      <ProtectedRoute path="/report/:id" component={ExamReport} />
      <ProtectedRoute path="/diagnosis/:id" component={DiagnosisPage} />
      <ProtectedRoute path="/results" component={ExamResults} />
      <ProtectedRoute path="/profile" component={Profile} />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SidebarProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </SidebarProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
