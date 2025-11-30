import React from "react";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import MobileHeader from "@/components/layout/mobile-header";
import { DoctorView } from "@/components/dashboard/doctor-view";

export default function Dashboard() {
  const { data: doctorStats, isLoading: isLoadingDoctorStats } = useQuery({
    queryKey: ["/api/doctor/dashboard-stats"],
    queryFn: async () => {
      const res = await fetch("/api/doctor/dashboard-stats");
      if (!res.ok) throw new Error("Failed to fetch doctor stats");
      return res.json();
    },
  });

  return (
    <div className="min-h-screen flex flex-col">
      <MobileHeader />

      <div className="flex flex-1 relative">
        <Sidebar />

        <main className="flex-1 bg-gray-50">
          <DoctorView stats={doctorStats} isLoading={isLoadingDoctorStats} />
        </main>
      </div>
    </div>
  );
}
