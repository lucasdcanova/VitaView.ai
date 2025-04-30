import { useState } from "react";
import Sidebar from "@/components/layout/sidebar";
import MobileHeader from "@/components/layout/mobile-header";
import MobileNav from "@/components/layout/mobile-nav";
import HealthScore from "@/components/health-score";
import HealthMetrics from "@/components/health-metrics";
import RecentExams from "@/components/recent-exams";
import HealthRecommendations from "@/components/health-recommendations";

export default function Dashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <MobileHeader toggleSidebar={toggleSidebar} />
      
      <div className="flex flex-1 relative">
        <Sidebar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        
        <main className="flex-1">
          <div className="p-4 md:p-6">
            <header className="mb-6">
              <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
              <p className="text-gray-600">Visão geral da sua saúde e últimas análises</p>
            </header>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <HealthScore score={78} />
              <HealthMetrics />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <RecentExams />
              </div>
              <div className="lg:col-span-1">
                <HealthRecommendations />
              </div>
            </div>
          </div>
        </main>
      </div>
      
      <MobileNav />
    </div>
  );
}
