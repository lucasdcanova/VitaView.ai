import React, { useState } from "react";
import Sidebar from "@/components/layout/sidebar";
import MobileHeader from "@/components/layout/mobile-header";
import PatientHeader from "@/components/patient-header";
import { AgendaCalendar } from "@/components/agenda/agenda-calendar";

export default function Agenda() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const handleNewAppointment = () => {
        // TODO: Implementar modal ou navegação para criar nova consulta
        console.log("Nova consulta");
    };

    return (
        <div className="min-h-screen flex flex-col">
            <MobileHeader />

            <div className="flex flex-1 relative">
                <Sidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />

                <main className="flex-1 bg-gray-50 px-6 py-8">
                    <div className="max-w-7xl mx-auto">
                        <PatientHeader
                            title="Agenda"
                            description="Gerencie suas consultas e visualize seus compromissos."
                            patient={undefined}
                            lastExamDate={null}
                            showTitleAsMain={true}
                        />

                        <div className="mt-6">
                            <AgendaCalendar onNewAppointment={handleNewAppointment} />
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
