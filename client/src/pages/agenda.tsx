import React, { useState } from "react";
import Sidebar from "@/components/layout/sidebar";
import MobileHeader from "@/components/layout/mobile-header";
import PatientHeader from "@/components/patient-header";
import { AgendaCalendar } from "@/components/agenda/agenda-calendar";
import { NewAppointmentModal } from "@/components/agenda/new-appointment-modal";
import { useToast } from "@/hooks/use-toast";

export default function Agenda() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isNewAppointmentOpen, setIsNewAppointmentOpen] = useState(false);
    const { toast } = useToast();

    const handleNewAppointment = () => {
        setIsNewAppointmentOpen(true);
    };

    const handleAppointmentSuccess = (data: any) => {
        console.log("Nova consulta agendada:", data);
        toast({
            title: "Consulta agendada",
            description: `Agendamento confirmado para ${data.patientName} às ${data.time}.`,
        });
        // Aqui você adicionaria a lógica para atualizar a lista de consultas
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

            <NewAppointmentModal
                open={isNewAppointmentOpen}
                onOpenChange={setIsNewAppointmentOpen}
                onSuccess={handleAppointmentSuccess}
            />
        </div>
    );
}
