import React from "react";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import MobileHeader from "@/components/layout/mobile-header";
import { useProfiles } from "@/hooks/use-profiles";
import { DoctorView } from "@/components/dashboard/doctor-view";
import { PatientView } from "@/components/dashboard/patient-view";

export default function Dashboard() {
  const { activeProfile, isLoading: isLoadingProfiles } = useProfiles();

  const { data: doctorStats, isLoading: isLoadingDoctorStats } = useQuery({
    queryKey: ["/api/doctor/dashboard-stats"],
    queryFn: async () => {
      const res = await fetch("/api/doctor/dashboard-stats");
      if (!res.ok) throw new Error("Failed to fetch doctor stats");
      return res.json();
    },
    enabled: !activeProfile // Only fetch if no profile is selected (overview mode)
  });

  if (isLoadingProfiles) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <MobileHeader />

      <div className="flex flex-1 relative">
        <Sidebar />

        <main className="flex-1 bg-gray-50">
          {!activeProfile ? (
            <DoctorView stats={doctorStats} isLoading={isLoadingDoctorStats} />
          ) : (
            <PatientView activeProfile={activeProfile} />
          )}
        </main>
      </div>
    </div>
  );
}
