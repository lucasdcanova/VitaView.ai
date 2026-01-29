import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { generatePrescriptionPDF } from "@/lib/prescription-pdf";
import type { Profile, Prescription } from "@shared/schema";
import { MEDICATION_DATABASE, CONTROLLED_MEDICATIONS } from "@/components/dialogs";

export interface AcutePrescriptionItem {
    id: string;
    name: string;
    dosage: string;
    frequency: string;
    daysOfUse?: number;
    quantity?: string;
    notes?: string;
    prescriptionType: 'padrao' | 'especial' | 'A' | 'B1' | 'B2' | 'C' | 'C1';
}

export function useCustomMedications() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    const { data: customMedications = [] } = useQuery<any[]>({
        queryKey: ["/api/custom-medications"],
    });

    const createCustomMedicationMutation = useMutation({
        mutationFn: async (newMedication: { name: string }) => {
            const res = await apiRequest("POST", "/api/custom-medications", newMedication);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/custom-medications"] });
        },
    });

    const deleteCustomMedicationMutation = useMutation({
        mutationFn: async (id: number) => {
            await apiRequest("DELETE", `/api/custom-medications/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/custom-medications"] });
            toast({ title: "Medicamento removido", description: "O medicamento personalizado foi excluído." });
        },
    });

    // Dialog State
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const form = useForm<{ name: string }>({ defaultValues: { name: "" } });

    const handleSubmit = (data: { name: string }) => {
        createCustomMedicationMutation.mutate(data, {
            onSuccess: () => {
                setIsDialogOpen(false);
                form.reset();
                toast({ title: "Sucesso", description: "Medicamento personalizado criado." });
            }
        });
    };

    const openDialog = () => {
        setIsDialogOpen(true);
    };

    return {
        customMedications,
        createCustomMedication: createCustomMedicationMutation.mutate,
        deleteCustomMedication: deleteCustomMedicationMutation.mutate,
        isDialogOpen,
        setIsDialogOpen,
        form: form as any, // Cast to any to satisfy general MedicationDialog form usage (simple subset)
        handleSubmit,
        openDialog,
        isPending: createCustomMedicationMutation.isPending
    };
}

export function usePrescriptionLogic(patient: Profile) {
    const { toast } = useToast();
    const { user } = useAuth();
    const queryClient = useQueryClient();

    // --- Receituário State ---
    const [receituarioMedOpen, setReceituarioMedOpen] = useState(false);
    const [receituarioSearchValue, setReceituarioSearchValue] = useState("");
    const [receituarioDaysOfUse, setReceituarioDaysOfUse] = useState("7");
    const [receituarioNotes, setReceituarioNotes] = useState("");
    const [receituarioDose, setReceituarioDose] = useState("");
    const [receituarioDoseUnit, setReceituarioDoseUnit] = useState("comprimido");
    const [receituarioQuantity, setReceituarioQuantity] = useState("");
    const [editingPrescriptionId, setEditingPrescriptionId] = useState<number | null>(null);
    const [prescriptionObservations, setPrescriptionObservations] = useState("");

    // --- Prescription State ---
    const [acuteItems, setAcuteItems] = useState<AcutePrescriptionItem[]>(() => {
        try {
            const saved = localStorage.getItem(`prescricao-rascunho-${patient.id}`);
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });

    // Auto-save acute items
    useEffect(() => {
        if (acuteItems.length > 0) {
            localStorage.setItem(`prescricao-rascunho-${patient.id}`, JSON.stringify(acuteItems));
        } else {
            localStorage.removeItem(`prescricao-rascunho-${patient.id}`);
        }
    }, [acuteItems, patient.id]);

    // Mutations
    const createPrescriptionMutation = useMutation({
        mutationFn: async (data: any) => {
            const res = await apiRequest("POST", "/api/prescriptions", data);
            return await res.json();
        },
        onSuccess: (savedData) => {
            queryClient.invalidateQueries({ queryKey: [`/api/prescriptions/patient/${patient.id}`] });
            toast({ title: "Sucesso", description: "Receita salva e gerada!" });
            setAcuteItems([]);
            setEditingPrescriptionId(null);
        },
        onError: (err) => {
            console.error(err);
            toast({ title: "Erro", description: "Falha ao salvar receita.", variant: "destructive" });
        }
    });

    const updatePrescriptionMutation = useMutation({
        mutationFn: async ({ id, data }: { id: number; data: any }) => {
            const res = await apiRequest("PUT", `/api/prescriptions/${id}`, data);
            return await res.json();
        },
        onSuccess: (savedData) => {
            queryClient.invalidateQueries({ queryKey: [`/api/prescriptions/patient/${patient.id}`] });
            toast({ title: "Sucesso", description: "Receita atualizada!" });
            setAcuteItems([]);
            setEditingPrescriptionId(null);
        },
        onError: (err) => {
            console.error(err);
            toast({ title: "Erro", description: "Falha ao atualizar receita.", variant: "destructive" });
        }
    });

    const addMedicationToReceituario = (medicationName: string, frequency: string, doseValue: string, doseUnit: string, quantity: string) => {
        if (!medicationName || !frequency || !doseValue) {
            toast({ title: "Erro", description: "Preencha o medicamento, dose e frequência.", variant: "destructive" });
            return;
        }

        const baseName = medicationName.split(" ")[0];
        const medInfo = MEDICATION_DATABASE.find(m => m.name.toLowerCase() === baseName.toLowerCase());
        let pType: 'padrao' | 'especial' | 'A' | 'B1' | 'B2' | 'C' | 'C1' = 'padrao';

        if (medInfo) {
            if (medInfo.category) {
                const controlled = CONTROLLED_MEDICATIONS.find(c => c.name.toLowerCase() === baseName.toLowerCase());
                if (controlled) {
                    pType = controlled.prescriptionType as any;
                } else if (medInfo.prescriptionType) {
                    pType = medInfo.prescriptionType as any;
                }
            }
            if (['Amoxicilina', 'Azitromicina', 'Ciprofloxacino', 'Claritromicina'].includes(medInfo.name)) {
                pType = 'especial';
            }
        } else {
            const controlled = CONTROLLED_MEDICATIONS.find(c => c.name.toLowerCase() === baseName.toLowerCase());
            if (controlled) {
                pType = controlled.prescriptionType as any;
            }
        }

        const dosageStr = `${doseValue} ${doseUnit}`;
        const newItem: AcutePrescriptionItem = {
            id: Math.random().toString(36).substr(2, 9),
            name: medicationName,
            dosage: dosageStr,
            frequency: frequency,
            daysOfUse: parseInt(receituarioDaysOfUse) || 7,
            quantity: quantity || undefined,
            notes: receituarioNotes || undefined,
            prescriptionType: pType
        };

        setAcuteItems([...acuteItems, newItem]);
        setReceituarioSearchValue("");
        setReceituarioDaysOfUse("7");
        setReceituarioNotes("");
        setReceituarioDose("");
        setReceituarioDoseUnit("comprimido");
        setReceituarioQuantity("");
        toast({ title: "Medicamento adicionado", description: `${medicationName} foi adicionado à receita.` });
    };

    const removeAcuteItem = (id: string) => {
        setAcuteItems(acuteItems.filter(i => i.id !== id));
    };

    const handleSaveAndPrintPrescription = async () => {
        if (acuteItems.length === 0) {
            toast({ title: "Prescrição vazia", description: "Adicione pelo menos um medicamento.", variant: "destructive" });
            return;
        }

        if (!user) {
            toast({ title: "Erro", description: "Usuário não identificado. Faça login novamente.", variant: "destructive" });
            return;
        }

        const pdfWindow = window.open('', '_blank');
        if (pdfWindow) {
            pdfWindow.document.write('<html><head><title>Gerando Receita...</title></head><body style="display:flex;justify-content:center;align-items:center;height:100vh;font-family:sans-serif;"><div><h2>Gerando Receita...</h2><p>Por favor, aguarde.</p></div></body></html>');
        } else {
            toast({ title: "Aviso", description: "O bloqueador de popups pode ter impedido a abertura da receita. Verifique as permissões do navegador.", variant: "destructive" });
        }

        const doctorName = user.fullName || user.username || "Dr. VitaView";
        const doctorCrm = user.crm || "CRM pendente";
        const doctorSpecialty = user.specialty || "Clínica Médica";

        const prescriptionData = {
            profileId: patient.id,
            userId: patient.userId,
            doctorName,
            doctorCrm,
            doctorSpecialty,
            medications: acuteItems.map(item => ({
                name: item.name,
                dosage: item.dosage,
                frequency: `${item.frequency}${item.daysOfUse ? ` por ${item.daysOfUse} dias` : ''}`,
                notes: item.notes,
                prescriptionType: item.prescriptionType
            })),
            issueDate: new Date().toISOString(),
            validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            observations: prescriptionObservations || undefined,
            status: 'active'
        };

        try {
            let savedData;
            if (editingPrescriptionId) {
                savedData = await updatePrescriptionMutation.mutateAsync({
                    id: editingPrescriptionId,
                    data: prescriptionData
                });
            } else {
                savedData = await createPrescriptionMutation.mutateAsync(prescriptionData);
            }

            if (pdfWindow) {
                generatePrescriptionPDF({
                    doctorName: savedData.doctorName,
                    doctorCrm: savedData.doctorCrm,
                    doctorSpecialty: savedData.doctorSpecialty || undefined,
                    doctorRqe: (user as any)?.rqe || undefined,
                    patientName: patient.name,
                    patientCpf: patient.cpf || undefined,
                    patientRg: patient.rg || undefined,
                    patientBirthDate: patient.birthDate || undefined,
                    patientAge: patient.birthDate ? `${new Date().getFullYear() - new Date(patient.birthDate.split("/").reverse().join("-")).getFullYear()} anos` : undefined,
                    patientGender: patient.gender || undefined,
                    patientPhone: patient.phone || undefined,
                    patientEmail: patient.email || undefined,
                    patientAddress: patient.street ? `${patient.street}${patient.number ? `, ${patient.number}` : ""}${patient.complement ? ` - ${patient.complement}` : ""}${patient.neighborhood ? ` - ${patient.neighborhood}` : ""}${patient.city ? `, ${patient.city}` : ""}${patient.state ? ` - ${patient.state}` : ""}${patient.cep ? ` (${patient.cep})` : ""}` : undefined,
                    patientGuardianName: patient.guardianName || undefined,
                    patientInsurance: patient.planType ? `${patient.planType}${patient.insuranceCardNumber ? ` - Comb: ${patient.insuranceCardNumber}` : ""}` : undefined,
                    issueDate: new Date(savedData.issueDate),
                    validUntil: new Date(savedData.validUntil),
                    medications: savedData.medications as any[],
                    observations: savedData.observations || undefined
                }, pdfWindow);
            }

            const successMsg = editingPrescriptionId ? "Receita atualizada e gerada!" : "Receita salva e gerada!";
            toast({ title: "Sucesso", description: successMsg });
            setAcuteItems([]);
            setEditingPrescriptionId(null);
            setPrescriptionObservations("");

        } catch (error) {
            console.error(error);
            if (pdfWindow) pdfWindow.close();
            toast({ title: "Erro", description: "Falha ao salvar receita.", variant: "destructive" });
        }
    };

    const handleEditPrescription = (p: Prescription) => {
        const meds = p.medications as any[];
        const items: AcutePrescriptionItem[] = meds.map((med, idx) => ({
            id: `edit-${p.id}-${idx}`,
            name: med.name,
            dosage: med.dosage || "",
            frequency: med.frequency?.split(" por ")[0] || med.frequency || "",
            daysOfUse: parseInt(med.frequency?.match(/por (\d+) dias/)?.[1] || "7"),
            quantity: med.quantity,
            notes: med.notes,
            prescriptionType: med.prescriptionType || 'padrao'
        }));
        setAcuteItems(items);
        setEditingPrescriptionId(p.id);
        setPrescriptionObservations(p.observations || "");
        toast({ title: "Receita carregada", description: "Edite os medicamentos e clique em Salvar." });
    };

    const handleRenewPrescription = async (selectedMeds: any[]) => {
        if (selectedMeds.length === 0) {
            toast({ title: "Seleção vazia", description: "Selecione pelo menos um medicamento para renovar.", variant: "destructive" });
            return;
        }

        if (!user) {
            toast({ title: "Erro", description: "Usuário não identificado. Faça login novamente.", variant: "destructive" });
            return;
        }

        const pdfWindow = window.open('', '_blank');
        if (pdfWindow) {
            pdfWindow.document.write('<html><head><title>Gerando Receita...</title></head><body style="display:flex;justify-content:center;align-items:center;height:100vh;font-family:sans-serif;"><div><h2>Gerando Receita...</h2><p>Por favor, aguarde.</p></div></body></html>');
        } else {
            toast({ title: "Aviso", description: "O bloqueador de popups pode ter impedido a abertura da receita. Verifique as permissões do navegador.", variant: "destructive" });
        }

        const doctorName = user.fullName || user.username || "Dr. VitaView";
        const doctorCrm = user.crm || "CRM pendente";
        const doctorSpecialty = user.specialty || "Clínica Médica";

        try {
            const savedData = await createPrescriptionMutation.mutateAsync({
                profileId: patient.id,
                userId: patient.userId,
                doctorName,
                doctorCrm,
                doctorSpecialty,
                medications: selectedMeds.map((med: any) => ({
                    name: med.name,
                    dosage: `${med.dosage}${med.dosageUnit || med.dosage_unit ? ' ' + (med.dosageUnit || med.dosage_unit) : ''}${(med.doseAmount > 1 || med.dose_amount > 1) ? ` (${med.doseAmount || med.dose_amount} ${med.format}s)` : ''}`.trim(),
                    frequency: med.frequency,
                    format: med.format,
                    quantity: med.quantity,
                    prescriptionType: med.prescriptionType || med.prescription_type || 'padrao',
                    notes: med.notes
                })),
                issueDate: new Date().toISOString(),
                validUntil: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(), // 180 dias
                observations: "Uso contínuo. Renovação de medicamentos.",
                status: 'active'
            });

            if (pdfWindow) {
                generatePrescriptionPDF({
                    doctorName: savedData.doctorName,
                    doctorCrm: savedData.doctorCrm,
                    doctorSpecialty: savedData.doctorSpecialty || undefined,
                    doctorRqe: (user as any)?.rqe || undefined,
                    patientName: patient.name,
                    patientCpf: patient.cpf || undefined,
                    patientRg: patient.rg || undefined,
                    patientBirthDate: patient.birthDate || undefined,
                    patientAge: patient.birthDate ? `${new Date().getFullYear() - new Date(patient.birthDate.split("/").reverse().join("-")).getFullYear()} anos` : undefined,
                    patientGender: patient.gender || undefined,
                    patientPhone: patient.phone || undefined,
                    patientEmail: patient.email || undefined,
                    patientAddress: patient.street ? `${patient.street}${patient.number ? `, ${patient.number}` : ""}${patient.complement ? ` - ${patient.complement}` : ""}${patient.neighborhood ? ` - ${patient.neighborhood}` : ""}${patient.city ? `, ${patient.city}` : ""}${patient.state ? ` - ${patient.state}` : ""}${patient.cep ? ` (${patient.cep})` : ""}` : undefined,
                    patientGuardianName: patient.guardianName || undefined,
                    patientInsurance: patient.planType ? `${patient.planType}${patient.insuranceCardNumber ? ` - Comb: ${patient.insuranceCardNumber}` : ""}` : undefined,
                    issueDate: new Date(savedData.issueDate),
                    validUntil: new Date(savedData.validUntil),
                    medications: savedData.medications as any[],
                    observations: savedData.observations || undefined
                }, pdfWindow);
            }

            toast({ title: "Sucesso", description: "Receita renovada e gerada!" });

        } catch (error) {
            console.error(error);
            if (pdfWindow) pdfWindow.close();
            toast({ title: "Erro", description: "Falha ao renovar receita.", variant: "destructive" });
        }
    };

    return {
        // State
        receituarioMedOpen, setReceituarioMedOpen,
        receituarioSearchValue, setReceituarioSearchValue,
        receituarioDaysOfUse, setReceituarioDaysOfUse,
        receituarioNotes, setReceituarioNotes,
        receituarioDose, setReceituarioDose,
        receituarioDoseUnit, setReceituarioDoseUnit,
        receituarioQuantity, setReceituarioQuantity,
        editingPrescriptionId, setEditingPrescriptionId,
        prescriptionObservations, setPrescriptionObservations,
        acuteItems, setAcuteItems,

        // Actions
        addMedicationToReceituario,
        removeAcuteItem,
        handleSaveAndPrintPrescription,
        handleEditPrescription,
        handleRenewPrescription
    };
}
