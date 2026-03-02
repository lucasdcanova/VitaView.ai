import {
  useAuth } from "@/hooks/use-auth";
import { Redirect, Route } from "wouter";

import { ComponentType, LazyExoticComponent } from "react";
import { BrandLoader } from "@/components/ui/brand-loader";

export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: ComponentType<any> | LazyExoticComponent<any>;
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <BrandLoader className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Route>
    );
  }

  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  const isPlatformAdmin = user.role === "admin";
  const requiresClinicSetup = !user.clinicId;
  const isClinicSetupRoute = path === "/minha-clinica";

  if (!isPlatformAdmin && requiresClinicSetup && !isClinicSetupRoute) {
    return (
      <Route path={path}>
        <Redirect to="/minha-clinica" />
      </Route>
    );
  }

  return <Route path={path} component={Component} />;
}
