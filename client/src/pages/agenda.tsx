import React, { useState } from "react";
import Sidebar from "@/components/layout/sidebar";
import MobileHeader from "@/components/layout/mobile-header";
import PatientHeader from "@/components/patient-header";
import { AgendaCalendar } from "@/components/agenda/agenda-calendar";
import { NewAppointmentModal } from "@/components/agenda/new-appointment-modal";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import { Sparkles, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function Agenda() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isNewAppointmentOpen, setIsNewAppointmentOpen] = useState(false);
    const { toast } = useToast();
    const [aiCommand, setAiCommand] = useState("");
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [aiProposal, setAiProposal] = useState<any>(null);

    // Create appointment mutation
    const createAppointmentMutation = useMutation({
        mutationFn: async (appointment: any) => {
            const res = await apiRequest("POST", "/api/appointments", appointment);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
            toast({
                title: "Agendamento criado",
                description: "O agendamento foi realizado com sucesso.",
            });
            setAiProposal(null);
            setAiCommand("");
        },
        onError: () => {
            toast({
                title: "Erro",
                description: "Não foi possível criar o agendamento.",
                variant: "destructive",
            });
        },
    });

    // AI Command handler
    const handleAiCommand = async () => {
        if (!aiCommand.trim()) return;

        setIsAiLoading(true);
        try {
            const res = await apiRequest("POST", "/api/appointments/ai-schedule", { command: aiCommand });
            const data = await res.json();
            setAiProposal(data);
        } catch (error) {
            toast({
                title: "Erro na IA",
                description: "Não foi possível processar o comando.",
                variant: "destructive",
            });
        } finally {
            setIsAiLoading(false);
        }
    };

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
                        >
                            <div className="w-full md:w-[400px] relative">
                                <Input
                                    placeholder="✨ Agende com IA: 'Retorno para Maria dia 15 às 14h'"
                                    className="bg-white border-blue-200 focus:border-blue-500 text-gray-800 placeholder:text-gray-400 pr-10 shadow-sm"
                                    value={aiCommand}
                                    onChange={(e) => setAiCommand(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAiCommand()}
                                    disabled={isAiLoading}
                                />
                                <button
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-500 hover:text-blue-700"
                                    onClick={handleAiCommand}
                                    disabled={isAiLoading}
                                >
                                    {isAiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                </button>
                            </div>
                        </PatientHeader>

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

            {/* AI Proposal Dialog */}
            <AlertDialog open={!!aiProposal} onOpenChange={(open) => !open && setAiProposal(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-blue-500" />
                            Confirmar Agendamento Sugerido
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            A IA identificou os seguintes detalhes para o agendamento:
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    {aiProposal && (
                        <div className="bg-slate-50 p-4 rounded-lg space-y-3 border border-slate-200 my-4">
                            <div className="grid grid-cols-3 gap-2 text-sm">
                                <span className="font-semibold text-slate-500">Paciente:</span>
                                <span className="col-span-2 font-medium">{aiProposal.patientName}</span>

                                <span className="font-semibold text-slate-500">Data:</span>
                                <span className="col-span-2 font-medium">{format(new Date(aiProposal.date + 'T12:00:00'), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>

                                <span className="font-semibold text-slate-500">Horário:</span>
                                <span className="col-span-2 font-medium">{aiProposal.time}</span>

                                <span className="font-semibold text-slate-500">Tipo:</span>
                                <span className="col-span-2 capitalize font-medium">{aiProposal.type}</span>

                                {aiProposal.notes && (
                                    <>
                                        <span className="font-semibold text-slate-500">Obs:</span>
                                        <span className="col-span-2 text-slate-700">{aiProposal.notes}</span>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => createAppointmentMutation.mutate(aiProposal)}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            Confirmar Agendamento
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
