import React, { useState, useRef } from "react";
import Sidebar from "@/components/layout/sidebar";
import MobileHeader from "@/components/layout/mobile-header";
import PatientHeader from "@/components/patient-header";
import { AgendaCalendar } from "@/components/agenda/agenda-calendar";
import { NewAppointmentModal } from "@/components/agenda/new-appointment-modal";
import { WaitingRoom } from "@/components/agenda/waiting-room";
import { Appointment } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import { Sparkles, Loader2, Paperclip, X } from "lucide-react";
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
    const [isNewAppointmentOpen, setIsNewAppointmentOpen] = useState(false);
    const [editingAppointment, setEditingAppointment] = useState<any>(null);
    const { toast } = useToast();
    const [aiCommand, setAiCommand] = useState("");
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [aiProposal, setAiProposal] = useState<any>(null);
    const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { data: appointments = [] } = useQuery<Appointment[]>({
        queryKey: ["/api/appointments"],
    });

    // Create appointment mutation
    const createAppointmentMutation = useMutation({
        mutationFn: async (appointment: any | any[]) => {
            if (Array.isArray(appointment)) {
                // Bulk create
                // We'll just loop here or create a bulk endpoint. 
                // Loop is safer for now without backend changes.
                const promises = appointment.map(apt => apiRequest("POST", "/api/appointments", apt));
                const results = await Promise.all(promises);
                return results;
            } else {
                const res = await apiRequest("POST", "/api/appointments", appointment);
                return res.json();
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
            toast({
                title: "Algendamento realizado",
                description: "Operação realizada com sucesso.",
            });
            setAiProposal(null);
            setAiCommand("");
        },
        onError: (error) => {
            console.error("Error creating appointment:", error);
            toast({
                title: "Erro",
                description: "Não foi possível criar o agendamento.",
                variant: "destructive",
            });
        }
    });

    // Update appointment mutation
    const updateAppointmentMutation = useMutation({
        mutationFn: async (data: any) => {
            const { id, ...rest } = data;
            const res = await apiRequest("PATCH", `/api/appointments/${id}`, rest);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
            toast({
                title: "Agendamento atualizado",
                description: "Os dados do agendamento foram atualizados.",
            });
            setIsNewAppointmentOpen(false);
            setEditingAppointment(null);
        },
        onError: () => {
            toast({
                title: "Erro",
                description: "Não foi possível atualizar o agendamento.",
                variant: "destructive",
            });
        }
    });

    // Delete blocked appointments mutation
    const deleteBlockedAppointmentsMutation = useMutation({
        mutationFn: async ({ startDate, endDate }: { startDate: string, endDate: string }) => {
            const res = await apiRequest("DELETE", "/api/appointments/blocks", { startDate, endDate });
            return res.json();
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
            toast({
                title: "Agenda desbloqueada",
                description: `${data.count} bloqueios foram removidos.`,
            });
            setAiProposal(null);
            setAiCommand("");
        },
        onError: () => {
            toast({
                title: "Erro",
                description: "Não foi possível desbloquear a agenda.",
                variant: "destructive",
            });
        }
    });

    // File upload handlers
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        const validFiles = files.filter(file => {
            const isValidType = file.type.startsWith('image/') || file.type === 'application/pdf';
            const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB

            if (!isValidType) {
                toast({
                    title: "Tipo de arquivo inválido",
                    description: `${file.name} não é uma imagem ou PDF.`,
                    variant: "destructive",
                });
            }
            if (!isValidSize) {
                toast({
                    title: "Arquivo muito grande",
                    description: `${file.name} excede o limite de 10MB.`,
                    variant: "destructive",
                });
            }

            return isValidType && isValidSize;
        });

        setUploadedFiles(prev => [...prev, ...validFiles].slice(0, 5)); // max 5 files
    };

    const removeFile = (index: number) => {
        setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    };

    // AI Command handler
    const handleAiCommand = async () => {
        if (!aiCommand.trim() && uploadedFiles.length === 0) return;

        setIsAiLoading(true);
        try {
            const formData = new FormData();
            formData.append('command', aiCommand);

            uploadedFiles.forEach((file, index) => {
                formData.append(`file${index}`, file);
            });

            const res = await fetch('/api/appointments/ai-schedule', {
                method: 'POST',
                body: formData,
                credentials: 'include',
            });

            if (!res.ok) throw new Error('Failed to process');

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
        setEditingAppointment(null);
        setIsNewAppointmentOpen(true);
    };

    const handleEditAppointment = (appointment: any) => {
        setEditingAppointment(appointment);
        setIsNewAppointmentOpen(true);
    };

    const handleAppointmentSuccess = (data: any) => {
        if (editingAppointment) {
            updateAppointmentMutation.mutate({ id: editingAppointment.id, ...data });
        } else {
            createAppointmentMutation.mutate(data);
            setIsNewAppointmentOpen(false); // Only close here for create, update closes in mutation success to wait for finish? 
            // Actually strictly speaking we can close immediately or wait. 
            // The original createMutation didn't close modal in mutation, but onSuccess of Modal called this.
            // But verify: Modal calls onOpenChange(false) immediately after Success callback?
            // Yes, Modal: onSuccess(data); onOpenChange(false);
            // So the modal closes itself.
            // But we can keep consistent logic.
        }
    };

    return (
        <div className="min-h-screen flex flex-col">
            <MobileHeader />

            <div className="flex flex-1 relative">
                <Sidebar />

                <main className="flex-1 bg-gray-50 flex flex-col h-full overflow-hidden">
                    <div className="flex-1 flex flex-col h-full w-full p-0 overflow-hidden">
                        <PatientHeader
                            title="Agenda"
                            description="Gerencie suas consultas e visualize seus compromissos."
                            patient={undefined}
                            lastExamDate={null}
                            showTitleAsMain={true}
                            fullWidth={true}
                        >
                            <div className="w-full md:w-[500px] space-y-2">
                                <div className="relative">
                                    <Input
                                        placeholder="✨ Agende com IA: 'Retorno para Maria dia 15 às 14h'"
                                        className="bg-white border-gray-200 focus:border-gray-500 text-gray-800 placeholder:text-gray-400 pr-20 shadow-sm"
                                        value={aiCommand}
                                        onChange={(e) => setAiCommand(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAiCommand()}
                                        disabled={isAiLoading}
                                    />
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                                        <button
                                            className="text-gray-500 hover:text-gray-700 p-1"
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={isAiLoading}
                                            title="Anexar arquivo (imagem ou PDF)"
                                        >
                                            <Paperclip className="w-4 h-4" />
                                        </button>
                                        <button
                                            className="text-gray-900 hover:text-black p-1"
                                            onClick={handleAiCommand}
                                            disabled={isAiLoading}
                                        >
                                            {isAiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*,.pdf"
                                        multiple
                                        className="hidden"
                                        onChange={handleFileSelect}
                                    />
                                </div>

                                {/* File previews */}
                                {uploadedFiles.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {uploadedFiles.map((file, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center gap-2 bg-gray-100 border border-gray-200 rounded-lg px-3 py-1.5 text-sm"
                                            >
                                                <span className="text-gray-700">
                                                    {file.type.startsWith('image/') ? '🖼️' : '📄'}
                                                </span>
                                                <span className="text-gray-700 max-w-[150px] truncate">
                                                    {file.name}
                                                </span>
                                                <span className="text-gray-500 text-xs">
                                                    ({(file.size / 1024).toFixed(0)} KB)
                                                </span>
                                                <button
                                                    onClick={() => removeFile(index)}
                                                    className="text-gray-500 hover:text-red-600 ml-1"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </PatientHeader>

                        <div className="mt-6 flex-1 overflow-auto">
                            <AgendaCalendar
                                onNewAppointment={handleNewAppointment}
                                onEditAppointment={handleEditAppointment}
                                fullWidth={true}
                            />
                        </div>

                        <div className="p-6 pt-0">
                            <WaitingRoom
                                appointments={appointments}
                                onStartService={(appointment) => {
                                    updateAppointmentMutation.mutate({
                                        id: appointment.id,
                                        status: 'in_progress'
                                    });
                                }}
                                onRemoveCheckIn={(appointment) => {
                                    updateAppointmentMutation.mutate({
                                        id: appointment.id,
                                        status: 'scheduled',
                                        checkedInAt: null
                                    } as any);
                                }}
                            />
                        </div>
                    </div>
                </main>
            </div>

            <NewAppointmentModal
                open={isNewAppointmentOpen}
                onOpenChange={(open) => {
                    setIsNewAppointmentOpen(open);
                    if (!open) setEditingAppointment(null);
                }}
                onSuccess={handleAppointmentSuccess}
                initialData={editingAppointment}
            />

            {/* AI Proposal Dialog */}
            <AlertDialog open={!!aiProposal} onOpenChange={(open) => !open && setAiProposal(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-gray-900" />
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
                                <span className="col-span-2 font-medium">
                                    {format(new Date(aiProposal.date + 'T12:00:00'), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                                    {aiProposal.endDate && (
                                        <> até {format(new Date(aiProposal.endDate + 'T12:00:00'), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</>
                                    )}
                                </span>

                                {(!aiProposal.isAllDay || (aiProposal.type !== 'blocked' && aiProposal.type !== 'unblock')) && (
                                    <>
                                        <span className="font-semibold text-slate-500">Horário:</span>
                                        <span className="col-span-2 font-medium">{aiProposal.time}</span>
                                    </>
                                )}

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
                            onClick={() => {
                                if (aiProposal.type === 'unblock') {
                                    const startDate = aiProposal.date;
                                    const endDate = aiProposal.endDate || aiProposal.date;
                                    deleteBlockedAppointmentsMutation.mutate({ startDate, endDate });
                                } else if (aiProposal.endDate && aiProposal.type === 'blocked') {
                                    // Parse dates ensuring local time handling (append time if normalized to date string)
                                    // However, aiProposal.date is YYYY-MM-DD.
                                    // New Date("YYYY-MM-DD") treats as UTC. 
                                    // New Date("YYYY-MM-DDPHH:mm:ss") treats as Local.
                                    // Let's use the time from proposal or default 12:00 to avoid timezone shifts on date boundaries if simpler.
                                    const startDate = new Date(aiProposal.date + 'T12:00:00');
                                    const endDate = new Date(aiProposal.endDate + 'T12:00:00');
                                    const appointments = [];

                                    let currentDate = new Date(startDate);

                                    while (currentDate <= endDate) {
                                        appointments.push({
                                            ...aiProposal,
                                            date: format(currentDate, 'yyyy-MM-dd'),
                                            profileId: undefined,
                                            endDate: undefined // remove endDate from individual AP
                                        });
                                        currentDate.setDate(currentDate.getDate() + 1);
                                    }

                                    createAppointmentMutation.mutate(appointments);
                                } else {
                                    createAppointmentMutation.mutate({
                                        ...aiProposal,
                                        profileId: aiProposal.patientId
                                    });
                                }
                            }}
                            className={aiProposal && aiProposal.type === 'unblock' ? "bg-red-600 hover:bg-red-700" : "bg-gray-900 hover:bg-black"}
                        >
                            {aiProposal && aiProposal.type === 'unblock' ? 'Remover Bloqueios' : 'Confirmar Agendamento'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div >
    );
}
