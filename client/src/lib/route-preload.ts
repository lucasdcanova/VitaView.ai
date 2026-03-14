const routeImporters = {
  agenda: () => import("@/pages/agenda"),
  patients: () => import("@/pages/patients"),
  vitaAssist: () => import("@/pages/vita-assist"),
  patientView: () => import("@/pages/patient-view"),
  myClinic: () => import("@/pages/my-clinic"),
  profile: () => import("@/pages/profile"),
  subscription: () => import("@/pages/subscription-management"),
} as const;

const hasPathPrefix = (path: string, prefix: string) =>
  path === prefix || path.startsWith(`${prefix}/`);

export function preloadRouteByPath(path: string) {
  if (hasPathPrefix(path, "/agenda")) {
    return routeImporters.agenda();
  }

  if (hasPathPrefix(path, "/pacientes")) {
    return routeImporters.patients();
  }

  if (hasPathPrefix(path, "/vita-assist")) {
    return routeImporters.vitaAssist();
  }

  if (hasPathPrefix(path, "/atendimento")) {
    return routeImporters.patientView();
  }

  if (hasPathPrefix(path, "/minha-clinica")) {
    return routeImporters.myClinic();
  }

  if (hasPathPrefix(path, "/profile")) {
    return routeImporters.profile();
  }

  if (hasPathPrefix(path, "/subscription")) {
    return routeImporters.subscription();
  }

  return Promise.resolve(null);
}

export function preloadCoreAuthenticatedRoutes() {
  return Promise.allSettled([
    routeImporters.agenda(),
    routeImporters.patients(),
    routeImporters.vitaAssist(),
    routeImporters.patientView(),
    routeImporters.myClinic(),
    routeImporters.profile(),
    routeImporters.subscription(),
  ]);
}
