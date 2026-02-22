import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { ExamRequestData } from "@/lib/exam-request-pdf";

// Interface para exame selecionado
export interface SelectedExam {
    id: string;
    name: string;
    type: 'laboratorial' | 'imagem' | 'outros';
    notes?: string;
}

// Interface para tipo ExamRequest do backend
export interface ExamRequestRecord {
    id: number;
    doctorName: string;
    doctorCrm: string;
    doctorSpecialty: string | null;
    exams: SelectedExam[];
    clinicalIndication: string | null;
    issueDate: string;
    status: string;
}

interface PatientData {
    id: number;
    userId: number;
    name: string;
    birthDate?: string | null;
    cpf?: string | null;
    phone?: string | null;
    street?: string | null;
    number?: string | null;
    neighborhood?: string | null;
    city?: string | null;
    state?: string | null;
    cep?: string | null;
    planType?: string | null;
    insuranceCardNumber?: string | null;
}

export function useExamRequestLogic(patient: PatientData) {
    const { user } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // State
    const [selectedExams, setSelectedExams] = useState<SelectedExam[]>([]);
    const [clinicalIndication, setClinicalIndication] = useState("");
    const [observations, setObservations] = useState("");
    const [editingRequestId, setEditingRequestId] = useState<number | null>(null);

    const loadExamRequestPdfGenerator = async () => {
        const { generateExamRequestPDF } = await import("@/lib/exam-request-pdf");
        return generateExamRequestPDF;
    };

    // Query para histórico
    const { data: examRequestHistory = [] } = useQuery<ExamRequestRecord[]>({
        queryKey: [`/api/exam-requests/patient/${patient.id}`],
        enabled: !!patient.id,
    });

    // Reset Form
    const resetForm = () => {
        setSelectedExams([]);
        setClinicalIndication("");
        setObservations("");
        setEditingRequestId(null);
    };

    // Mutation para criar solicitação
    const createMutation = useMutation({
        mutationFn: async (data: any) => {
            const res = await apiRequest("POST", "/api/exam-requests", data);
            return await res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`/api/exam-requests/patient/${patient.id}`] });
            resetForm();
        },
        onError: (err) => {
            console.error(err);
            toast({ title: "Erro", description: "Falha ao salvar solicitação.", variant: "destructive" });
        }
    });

    // Mutation para atualizar solicitação
    const updateMutation = useMutation({
        mutationFn: async ({ id, data }: { id: number; data: any }) => {
            const res = await apiRequest("PUT", `/api/exam-requests/${id}`, data);
            return await res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`/api/exam-requests/patient/${patient.id}`] });
            resetForm();
        },
        onError: (err) => {
            console.error(err);
            toast({ title: "Erro", description: "Falha ao atualizar solicitação.", variant: "destructive" });
        }
    });

    // Actions
    const addExam = (exam: { name: string; type: 'laboratorial' | 'imagem' | 'outros' }) => {
        const id = `${Date.now()}-${Math.random()}`;
        setSelectedExams(prev => [...prev, { ...exam, id }]);
    };

    const removeExam = (id: string) => {
        setSelectedExams(prev => prev.filter(e => e.id !== id));
    };

    const updateExamNotes = (id: string, notes: string) => {
        setSelectedExams(prev => prev.map(e => e.id === id ? { ...e, notes } : e));
    };

    const handleEditRequest = (request: ExamRequestRecord) => {
        setEditingRequestId(request.id);
        const examsWithIds = request.exams.map((e: any) => ({
            ...e,
            id: e.id || `${Date.now()}-${Math.random()}` // Ensure ID exists
        }));
        setSelectedExams(examsWithIds);
        setClinicalIndication(request.clinicalIndication || "");
        setObservations((request as any).observations || ""); // Type assumption based on backend
        toast({ title: "Modo de edição", description: "Edite a solicitação e clique em Salvar." });
    };

    // Save and Print
    const handleSaveAndPrint = async () => {
        if (selectedExams.length === 0) {
            toast({ title: "Lista vazia", description: "Adicione pelo menos um exame.", variant: "destructive" });
            return;
        }
        if (!user) {
            toast({ title: "Erro", description: "Usuário não identificado.", variant: "destructive" });
            return;
        }

        const pdfWindow = window.open('', '_blank');
        if (pdfWindow) {
            pdfWindow.document.write('<html><head><title>Gerando Solicitação...</title></head><body style="display:flex;justify-content:center;align-items:center;height:100vh;font-family:sans-serif;"><div><h2>Gerando Solicitação...</h2><p>Por favor, aguarde.</p></div></body></html>');
        }

        const doctorName = user.fullName || user.username || "Dr. VitaView";
        const doctorCrm = user.crm || "CRM pendente";
        const doctorSpecialty = user.specialty || "Clínica Médica";

        const requestData = {
            profileId: patient.id,
            userId: patient.userId,
            doctorName,
            doctorCrm,
            doctorSpecialty,
            exams: selectedExams.map(e => ({
                name: e.name,
                type: e.type,
                notes: e.notes
            })),
            clinicalIndication: clinicalIndication || undefined,
            observations: observations || undefined,
            issueDate: new Date().toISOString(),
            status: 'pending'
        };

        try {
            let savedData;
            if (editingRequestId) {
                savedData = await updateMutation.mutateAsync({ id: editingRequestId, data: requestData });
            } else {
                savedData = await createMutation.mutateAsync(requestData);
            }

            if (pdfWindow) {
                const pdfData: ExamRequestData = {
                    doctorName: savedData.doctorName,
                    doctorCrm: savedData.doctorCrm,
                    doctorSpecialty: savedData.doctorSpecialty || undefined,
                    doctorRqe: (user as any)?.rqe || undefined,
                    patientName: patient.name,
                    patientCpf: patient.cpf || undefined,
                    patientBirthDate: patient.birthDate || undefined,
                    patientAddress: patient.street ? `${patient.street}${patient.number ? `, ${patient.number}` : ""}${patient.neighborhood ? ` - ${patient.neighborhood}` : ""}${patient.city ? `, ${patient.city}` : ""}${patient.state ? ` - ${patient.state}` : ""}` : undefined,
                    patientPhone: patient.phone || undefined,
                    patientInsurance: patient.planType ? `${patient.planType}${patient.insuranceCardNumber ? ` - ${patient.insuranceCardNumber}` : ""}` : undefined,
                    issueDate: new Date(savedData.issueDate),
                    exams: savedData.exams as any[],
                    clinicalIndication: savedData.clinicalIndication || undefined,
                    observations: savedData.observations || undefined
                };
                const generateExamRequestPDF = await loadExamRequestPdfGenerator();
                generateExamRequestPDF(pdfData, pdfWindow);
            }

            toast({ title: "Sucesso", description: editingRequestId ? "Solicitação atualizada!" : "Solicitação salva!" });

        } catch (error) {
            console.error(error);
            if (pdfWindow) pdfWindow.close();
            toast({ title: "Erro", description: "Falha ao salvar solicitação.", variant: "destructive" });
        }
    };

    const handleReprint = async (request: any) => {
        const pdfWindow = window.open('', '_blank');
        if (!pdfWindow) return;

        try {
            const pdfData: ExamRequestData = {
                doctorName: request.doctorName,
                doctorCrm: request.doctorCrm,
                doctorSpecialty: request.doctorSpecialty || undefined,
                doctorRqe: undefined, // Might need to fetch or store this
                patientName: patient.name,
                patientCpf: patient.cpf || undefined,
                patientBirthDate: patient.birthDate || undefined,
                patientAddress: patient.street ? `${patient.street}${patient.number ? `, ${patient.number}` : ""}${patient.neighborhood ? ` - ${patient.neighborhood}` : ""}${patient.city ? `, ${patient.city}` : ""}${patient.state ? ` - ${patient.state}` : ""}` : undefined,
                patientPhone: patient.phone || undefined,
                patientInsurance: patient.planType ? `${patient.planType}${patient.insuranceCardNumber ? ` - ${patient.insuranceCardNumber}` : ""}` : undefined,
                issueDate: new Date(request.issueDate),
                exams: request.exams as any[],
                clinicalIndication: request.clinicalIndication || undefined,
                observations: request.observations || undefined
            };
            const generateExamRequestPDF = await loadExamRequestPdfGenerator();
            generateExamRequestPDF(pdfData, pdfWindow);
        } catch (error) {
            console.error(error);
            pdfWindow.close();
            toast({
                title: "Erro",
                description: "Falha ao gerar PDF da solicitação.",
                variant: "destructive"
            });
        }
    };

    return {
        // State
        selectedExams, setSelectedExams,
        clinicalIndication, setClinicalIndication,
        observations, setObservations,
        editingRequestId, setEditingRequestId,
        examRequestHistory,

        // Actions
        addExam,
        removeExam,
        updateExamNotes,
        handleEditRequest,
        handleSaveAndPrint,
        handleReprint,
        resetForm
    };
}
