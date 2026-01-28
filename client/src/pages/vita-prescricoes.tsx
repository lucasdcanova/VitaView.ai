import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { generatePrescriptionPDF } from "@/lib/prescription-pdf";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    PlusCircle,
    FileText,
    Trash2,
    Stethoscope,
    Printer,
    History,
    Ban,
    AlertTriangle,
    Pill,
    Save,
    Check,
    RefreshCw,
    Pencil
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    medicationSchema,
    MedicationDialog,
    type MedicationFormData,
    ALL_MEDICATIONS_WITH_PRESENTATIONS,
    FREQUENCIES,
    getMedicationIcon,
    PrescriptionTypeBadge,
    MEDICATION_DATABASE,
    MEDICATION_FORMATS,
    DOSAGE_UNITS,
    PRESCRIPTION_TYPES,
    CONTROLLED_MEDICATIONS
} from "@/components/dialogs";
import { format } from "date-fns";
import type { Profile, Prescription, CustomMedication } from "@shared/schema";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Search, ChevronsUpDown, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AcutePrescriptionItem {
    id: string;
    name: string;
    dosage: string;
    frequency: string;
    daysOfUse?: number;
    quantity?: string;
    notes?: string;
    prescriptionType: 'padrao' | 'especial' | 'A' | 'B1' | 'B2' | 'C' | 'C1'; // Matches PDF generator keys
}

interface VitaPrescriptionsProps {
    patient: Profile;
    medications?: any[]; // Optional - if provided, will use this data instead of fetching
    allergies?: any[]; // Optional - if provided, will use this data instead of fetching
}

export default function VitaPrescriptions({ patient, medications: propMedications, allergies: propAllergies }: VitaPrescriptionsProps) {
    const { toast } = useToast();
    const { user } = useAuth();
    const queryClient = useQueryClient();

    // Fetch custom medications
    const { data: customMedications = [] } = useQuery<CustomMedication[]>({
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

    // --- Continuous Medications State ---
    const [isMedicationDialogOpen, setIsMedicationDialogOpen] = useState(false);
    const [editingMedication, setEditingMedication] = useState<any>(null);
    const [selectedMedications, setSelectedMedications] = useState<Set<number>>(new Set());
    const [editingPrescriptionId, setEditingPrescriptionId] = useState<number | null>(null);

    // --- Receituário State ---
    const [receituarioMedOpen, setReceituarioMedOpen] = useState(false);
    const [receituarioSearchValue, setReceituarioSearchValue] = useState("");
    const [receituarioDaysOfUse, setReceituarioDaysOfUse] = useState("7");
    const [receituarioNotes, setReceituarioNotes] = useState("");
    const [receituarioDose, setReceituarioDose] = useState("");
    const [receituarioDoseUnit, setReceituarioDoseUnit] = useState("comprimido");
    const [receituarioDosePopoverOpen, setReceituarioDosePopoverOpen] = useState(false);
    const [receituarioPatientWeight, setReceituarioPatientWeight] = useState("");
    const [receituarioQuantity, setReceituarioQuantity] = useState("");

    // Função para calcular dose pediátrica baseada no peso
    const calculatePediatricDose = (pres: any, weight: number) => {
        if (!pres.isPediatric || !pres.dosePerKg || !pres.concentration || !pres.frequency) {
            return null;
        }
        const dailyDoseLow = pres.dosePerKg * weight;
        const dailyDoseHigh = (pres.dosePerKgMax || pres.dosePerKg) * weight;
        const maxDaily = pres.maxDailyDose || Infinity;
        const effectiveDailyLow = Math.min(dailyDoseLow, maxDaily);
        const effectiveDailyHigh = Math.min(dailyDoseHigh, maxDaily);
        const dosePerAdminLow = effectiveDailyLow / pres.frequency;
        const dosePerAdminHigh = effectiveDailyHigh / pres.frequency;
        const mlPerAdminLow = dosePerAdminLow / pres.concentration;
        const mlPerAdminHigh = dosePerAdminHigh / pres.concentration;
        return {
            mlPerAdminLow: Math.round(mlPerAdminLow * 10) / 10,
            mlPerAdminHigh: Math.round(mlPerAdminHigh * 10) / 10,
        };
    };


    const medicationForm = useForm<MedicationFormData>({
        resolver: zodResolver(medicationSchema),
        defaultValues: {
            name: "",
            format: "comprimido",
            dosage: "",
            dosageUnit: "mg",
            frequency: "",
            doseAmount: 1,
            prescriptionType: "padrao",
            quantity: "",
            administrationRoute: "oral",
            startDate: new Date().toISOString().split('T')[0],
            notes: "",
        },
    });

    const editMedicationForm = useForm<MedicationFormData>({
        resolver: zodResolver(medicationSchema),
        defaultValues: {
            name: "",
            format: "comprimido",
            dosage: "",
            dosageUnit: "mg",
            frequency: "",
            doseAmount: 1,
            prescriptionType: "padrao",
            quantity: "",
            administrationRoute: "oral",
            startDate: "",
            notes: "",
        },
    });

    // Form for receituario
    const receituarioForm = useForm<MedicationFormData>({
        resolver: zodResolver(medicationSchema),
        defaultValues: {
            name: "",
            format: "comprimido",
            dosage: "",
            dosageUnit: "mg",
            frequency: "",
            doseAmount: 1,
            prescriptionType: "padrao",
            quantity: "",
            administrationRoute: "oral",
            startDate: new Date().toISOString().split('T')[0],
            notes: "",
        },
    });

    // Calculate quantity automatically
    const watchedFrequency = receituarioForm.watch("frequency");

    // Calculate quantity automatically
    useEffect(() => {
        if (!watchedFrequency || !receituarioDose || !receituarioDaysOfUse) return;

        const days = parseInt(receituarioDaysOfUse) || 0;
        let dailyFreq = 0;

        switch (watchedFrequency) {
            case "1x ao dia": dailyFreq = 1; break;
            case "2x ao dia": dailyFreq = 2; break;
            case "3x ao dia": dailyFreq = 3; break;
            case "4x ao dia": dailyFreq = 4; break;
            case "12h em 12h": dailyFreq = 2; break;
            case "8h em 8h": dailyFreq = 3; break;
            case "6h em 6h": dailyFreq = 4; break;
            case "4h em 4h": dailyFreq = 6; break;
            case "Quando necessário": dailyFreq = 1; break;
            default: dailyFreq = 0;
        }

        if (days === 0 || dailyFreq === 0) return;

        // Handle ranges usage
        const doseParts = receituarioDose.split('-');
        const doseVal = parseFloat(doseParts.length > 1 ? doseParts[1] : doseParts[0].replace(',', '.')) || 0;

        const formatLower = receituarioDoseUnit.toLowerCase();

        const isSolid = formatLower === 'cp' || formatLower === 'cps' || formatLower.includes("comprimido") || formatLower.includes("capsula");
        const isLiquid = formatLower === 'gt' || formatLower === 'ml' || formatLower.includes("gotas") || formatLower.includes("xarope") || formatLower.includes("suspensao");

        const totalDoses = dailyFreq * days;

        if (isSolid) {
            const qty = Math.ceil(doseVal * totalDoses);
            const suffix = (formatLower === 'cps' || formatLower.includes("capsula")) ? "cápsulas" : "comprimidos";
            setReceituarioQuantity(`${qty} ${suffix}`);
        } else if (isLiquid) {
            if (formatLower === 'gt' || formatLower.includes("gotas")) {
                const totalDrops = doseVal * totalDoses;
                const frascos = Math.ceil(totalDrops / 400); // 400 gotas per frasco
                setReceituarioQuantity(`${frascos} ${frascos === 1 ? 'frasco' : 'frascos'}`);
            } else {
                const totalMl = doseVal * totalDoses;
                const frascos = Math.ceil(totalMl / 100); // 100ml per frasco
                setReceituarioQuantity(`${frascos} ${frascos === 1 ? 'frasco' : 'frascos'}`);
            }
        } else if (formatLower.includes("pomada") || formatLower.includes("creme") || formatLower.includes("gel") || formatLower === 'aplicacao') {
            setReceituarioQuantity("1 bisnaga");
        } else if (formatLower.includes("spray") || formatLower.includes("aerosol") || formatLower === 'puff') {
            setReceituarioQuantity("1 frasco");
        } else if (formatLower === 'amp' || formatLower.includes("injecao") || formatLower.includes("ampola")) {
            const qty = Math.ceil(doseVal * totalDoses);
            setReceituarioQuantity(`${qty} ampolas`);
        } else if (formatLower === 'sache' || formatLower.includes("sache") || formatLower.includes("sachê")) {
            const qty = Math.ceil(doseVal * totalDoses);
            setReceituarioQuantity(`${qty} sachês`);
        } else if (formatLower === 'adesivo' || formatLower.includes("adesivo")) {
            const qty = Math.ceil(doseVal * totalDoses);
            setReceituarioQuantity(`${qty} adesivos`);
        } else if (formatLower === 'supositorio' || formatLower.includes("supositorio") || formatLower.includes("supositório")) {
            const qty = Math.ceil(doseVal * totalDoses);
            setReceituarioQuantity(`${qty} supositórios`);
        }

    }, [receituarioDose, receituarioDoseUnit, receituarioDaysOfUse, watchedFrequency]);

    // --- Prescription State --- 
    // Persist draft prescription items in localStorage per patient
    const [acuteItems, setAcuteItems] = useState<AcutePrescriptionItem[]>(() => {
        try {
            const saved = localStorage.getItem(`prescricao-rascunho-${patient.id}`);
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });

    const [prescriptionObservations, setPrescriptionObservations] = useState("");

    // Auto-save acute items to localStorage
    useEffect(() => {
        if (acuteItems.length > 0) {
            localStorage.setItem(`prescricao-rascunho-${patient.id}`, JSON.stringify(acuteItems));
        } else {
            localStorage.removeItem(`prescricao-rascunho-${patient.id}`);
        }
    }, [acuteItems, patient.id]);

    // History Queries
    const { data: prescriptionHistory = [] } = useQuery<Prescription[]>({
        queryKey: [`/api/prescriptions/patient/${patient.id}`],
        enabled: !!patient.id
    });

    // Fetches patient allergies (only if not provided via props)
    const { data: fetchedAllergies = [] } = useQuery<any[]>({
        queryKey: [`/api/allergies/patient/${patient.id}`],
        enabled: !propAllergies && !!patient.id
    });
    const allergies = propAllergies || fetchedAllergies;

    // Fetches continuous medications (only if not provided via props)
    const { data: fetchedMedications = [] } = useQuery<any[]>({
        queryKey: ["/api/medications"],
        enabled: !propMedications
    });
    const medications = propMedications || fetchedMedications;

    // Mutations

    const createPrescriptionMutation = useMutation({
        mutationFn: async (data: any) => {
            const res = await apiRequest("POST", "/api/prescriptions", data);
            return await res.json();
        },
        onSuccess: (savedData) => {
            queryClient.invalidateQueries({ queryKey: [`/api/prescriptions/patient/${patient.id}`] });

            // Log for debugging
            console.log("Prescription saved:", savedData);

            // PDF generation is now handled manually in the calling function
            // to support opening in a new tab without popup blocking.

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
            console.log("Prescription updated:", savedData);
            toast({ title: "Sucesso", description: "Receita atualizada!" });
            setAcuteItems([]);
            setEditingPrescriptionId(null);
        },
        onError: (err) => {
            console.error(err);
            toast({ title: "Erro", description: "Falha ao atualizar receita.", variant: "destructive" });
        }
    });



    // Continuous Medication Mutations
    const addMedicationMutation = useMutation({
        mutationFn: (data: MedicationFormData) => apiRequest("POST", "/api/medications", data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/medications"] });
            medicationForm.reset();
            setIsMedicationDialogOpen(false);
            toast({ title: "Sucesso", description: "Medicamento adicionado com sucesso!" });
        },
        onError: (error: Error) => {
            let errorMsg = "Erro ao adicionar medicamento.";
            try {
                // Tenta extrair a mensagem de erro detalhada da resposta do servidor
                // O formato do erro é "STATUS: CORPO_DA_RESPOSTA"
                const parts = error.message.split(': ');
                if (parts.length > 1) {
                    const errorBody = JSON.parse(parts.slice(1).join(': '));
                    if (errorBody.error) {
                        errorMsg = `Erro: ${errorBody.error}`;
                    } else if (errorBody.message) {
                        errorMsg = errorBody.message;
                    }
                }
            } catch (e) {
                console.error("Erro ao parsear resposta de erro:", e);
            }
            toast({ title: "Erro", description: errorMsg, variant: "destructive" });
        },
    });

    const editMedicationMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: MedicationFormData }) =>
            apiRequest("PUT", `/api/medications/${id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/medications"] });
            editMedicationForm.reset();
            setEditingMedication(null);
            setIsMedicationDialogOpen(false);
            toast({ title: "Sucesso", description: "Medicamento atualizado com sucesso!" });
        },
        onError: (error: Error) => {
            let errorMsg = "Erro ao atualizar medicamento.";
            try {
                const parts = error.message.split(': ');
                if (parts.length > 1) {
                    const errorBody = JSON.parse(parts.slice(1).join(': '));
                    if (errorBody.error) {
                        errorMsg = `Erro: ${errorBody.error}`;
                    } else if (errorBody.message) {
                        errorMsg = errorBody.message;
                    }
                }
            } catch (e) {
                console.error("Erro ao parsear resposta de erro:", e);
            }
            toast({ title: "Erro", description: errorMsg, variant: "destructive" });
        },
    });

    const deleteMedicationMutation = useMutation({
        mutationFn: (id: number) => apiRequest("DELETE", `/api/medications/${id}`, {}),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/medications"] });
            toast({ title: "Sucesso", description: "Medicamento excluído com sucesso!" });
        },
        onError: () => {
            toast({ title: "Erro", description: "Erro ao excluir medicamento.", variant: "destructive" });
        },
    });

    const onMedicationSubmit = (data: MedicationFormData) => {
        if (editingMedication) {
            editMedicationMutation.mutate({ id: editingMedication.id, data });
        } else {
            addMedicationMutation.mutate(data);
        }
    };

    const openEditMedicationDialog = (medication: any) => {
        setEditingMedication(medication);
        editMedicationForm.reset({
            name: medication.name,
            format: medication.format,
            dosage: medication.dosage,
            dosageUnit: medication.dosageUnit || medication.dosage_unit || "mg",
            frequency: medication.frequency,
            doseAmount: medication.doseAmount || medication.dose_amount || 1,
            prescriptionType: medication.prescriptionType || medication.prescription_type || "padrao",
            quantity: medication.quantity || "",
            administrationRoute: medication.administrationRoute || medication.administration_route || "oral",
            startDate: medication.startDate ? medication.startDate.split('T')[0] : "",
            notes: medication.notes || "",
        });
        setIsMedicationDialogOpen(true);
    };

    // Receituário Inline Handler
    const addMedicationToReceituario = (medicationName: string, frequency: string, doseValue: string, doseUnit: string, quantity: string) => {
        if (!medicationName || !frequency || !doseValue) {
            toast({ title: "Erro", description: "Preencha o medicamento, dose e frequência.", variant: "destructive" });
            return;
        }

        // Determine prescription type from DB
        const baseName = medicationName.split(" ")[0];
        const medInfo = MEDICATION_DATABASE.find(m => m.name.toLowerCase() === baseName.toLowerCase());
        // Antibiotics are "especial", CONTROLLED_MEDICATIONS covers others, default to 'padrao'
        let pType: 'padrao' | 'especial' | 'A' | 'B1' | 'B2' | 'C' | 'C1' = 'padrao';

        if (medInfo) {
            if (medInfo.category) {
                // Map category to prescriptionType if possible or use a lookup
                // Simple heuristic: if it's in the controlled list, use that type
                const controlled = CONTROLLED_MEDICATIONS.find(c => c.name.toLowerCase() === baseName.toLowerCase());
                if (controlled) {
                    pType = controlled.prescriptionType as any;
                } else if (medInfo.prescriptionType) {
                    pType = medInfo.prescriptionType as any;
                }
            }
            // Explicit check for known antibiotics if not yet caught
            if (['Amoxicilina', 'Azitromicina', 'Ciprofloxacino', 'Claritromicina'].includes(medInfo.name)) {
                pType = 'especial';
            }
        } else {
            // Fallback check against controlled list directly
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
        console.log('[DEBUG] Adding med:', medicationName, 'prescriptionType:', pType);
        setAcuteItems([...acuteItems, newItem]);
        setReceituarioSearchValue("");
        receituarioForm.reset();
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

        // 1. Abrir nova aba IMEDIATAMENTE (síncrono) para evitar bloqueio de popup
        const pdfWindow = window.open('', '_blank');
        if (pdfWindow) {
            pdfWindow.document.write('<html><head><title>Gerando Receita...</title></head><body style="display:flex;justify-content:center;align-items:center;height:100vh;font-family:sans-serif;"><div><h2>Gerando Receita...</h2><p>Por favor, aguarde.</p></div></body></html>');
        } else {
            toast({ title: "Aviso", description: "O bloqueador de popups pode ter impedido a abertura da receita. Verifique as permissões do navegador.", variant: "destructive" });
        }

        const itemsToSave = acuteItems;

        const doctorName = user.fullName || user.username || "Dr. VitaView";
        const doctorCrm = user.crm || "CRM pendente";
        const doctorSpecialty = user.specialty || "Clínica Médica";

        const prescriptionData = {
            profileId: patient.id,
            userId: patient.userId,
            doctorName,
            doctorCrm,
            doctorSpecialty,
            medications: itemsToSave.map(item => ({
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
                // Atualizar receita existente
                savedData = await updatePrescriptionMutation.mutateAsync({
                    id: editingPrescriptionId,
                    data: prescriptionData
                });
            } else {
                // Criar nova receita
                savedData = await createPrescriptionMutation.mutateAsync(prescriptionData);
            }

            // 3. Gerar PDF na janela aberta
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

    // Helper para formatar nomes dos medicamentos para exibição no histórico
    const formatMedicationNames = (medications: any[]): string => {
        if (!medications || medications.length === 0) return "Receita vazia";
        const names = medications.map(m => m.name.split(" ")[0]); // Pega só o primeiro nome/princípio ativo
        if (names.length <= 3) {
            return names.join(", ");
        }
        return `${names.slice(0, 3).join(", ")} +${names.length - 3}`;
    };

    const handleReprintPrescription = (p: Prescription) => {
        generatePrescriptionPDF({
            doctorName: p.doctorName,
            doctorCrm: p.doctorCrm,
            doctorSpecialty: p.doctorSpecialty || undefined,
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
            issueDate: new Date(p.issueDate),
            validUntil: new Date(p.validUntil),
            medications: p.medications as any[],
            observations: p.observations || undefined
        });
    };

    // Carregar receita para edição
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

    // --- Renewal Prescription Handler ---
    const handleRenewPrescription = async () => {
        if (selectedMedications.size === 0) {
            toast({ title: "Seleção vazia", description: "Selecione pelo menos um medicamento para renovar.", variant: "destructive" });
            return;
        }

        if (!user) {
            toast({ title: "Erro", description: "Usuário não identificado. Faça login novamente.", variant: "destructive" });
            return;
        }

        // 1. Abrir nova aba IMEDIATAMENTE (síncrono)
        const pdfWindow = window.open('', '_blank');
        if (pdfWindow) {
            pdfWindow.document.write('<html><head><title>Gerando Receita...</title></head><body style="display:flex;justify-content:center;align-items:center;height:100vh;font-family:sans-serif;"><div><h2>Gerando Receita...</h2><p>Por favor, aguarde.</p></div></body></html>');
        } else {
            toast({ title: "Aviso", description: "O bloqueador de popups pode ter impedido a abertura da receita. Verifique as permissões do navegador.", variant: "destructive" });
        }

        const selectedMeds = medications.filter((med: any) => selectedMedications.has(med.id));
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
                validUntil: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(), // 180 dias para uso contínuo
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
            setSelectedMedications(new Set());

        } catch (error) {
            console.error(error);
            if (pdfWindow) pdfWindow.close();
            toast({ title: "Erro", description: "Falha ao renovar receita.", variant: "destructive" });
        }
    };

    const toggleMedicationSelection = (id: number) => {
        setSelectedMedications(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const toggleSelectAll = () => {
        if (selectedMedications.size === medications.length) {
            setSelectedMedications(new Set());
        } else {
            setSelectedMedications(new Set(medications.map((m: any) => m.id)));
        }
    };

    return (
        <div className="space-y-6 pb-20">
            {/* Allergies Warning */}
            {allergies.length > 0 && (
                <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded-md flex items-start">
                    <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                        <h3 className="text-red-800 font-semibold text-sm">Alergias Conhecidas</h3>
                        <ul className="mt-1 list-disc list-inside text-sm text-red-700">
                            {allergies.map((allergy: any) => (
                                <li key={allergy.id}>
                                    <span className="font-medium">{allergy.allergen}</span>
                                    {allergy.reaction && <span className="text-red-600"> - {allergy.reaction}</span>}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}

            {/* 2-Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* --- COLUNA ESQUERDA: USO CONTÍNUO --- */}
                <Card className="border-blue-100 shadow-md h-fit">
                    <CardHeader className="bg-blue-50/50 border-b border-blue-100 pb-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-lg text-gray-900 flex items-center gap-2">
                                    <Pill className="h-5 w-5 text-blue-700" />
                                    Medicamentos de Uso Contínuo
                                </CardTitle>
                                <CardDescription className="text-sm">Selecione para renovar receita.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                        {medications.length > 0 ? (
                            <div className="space-y-3">
                                {/* Select All */}
                                <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); toggleSelectAll(); }}
                                        className={`h-5 w-5 rounded border-2 flex items-center justify-center transition-colors ${selectedMedications.size === medications.length
                                            ? 'bg-blue-600 border-blue-600 text-white'
                                            : 'border-gray-300 hover:border-blue-400'
                                            }`}
                                    >
                                        {selectedMedications.size === medications.length && <Check className="h-3 w-3" />}
                                    </button>
                                    <span className="text-sm text-gray-600">
                                        {selectedMedications.size === medications.length ? 'Desmarcar todos' : 'Selecionar todos'}
                                    </span>
                                </div>

                                <div className="grid gap-2 max-h-[400px] overflow-y-auto pr-1">
                                    {medications.map((medication: any) => (
                                        <div
                                            key={medication.id}
                                            onClick={() => toggleMedicationSelection(medication.id)}
                                            className={`p-3 bg-white rounded-lg border transition-all cursor-pointer group ${selectedMedications.has(medication.id)
                                                ? 'border-blue-400 bg-blue-50/50 shadow-sm'
                                                : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    {/* Checkbox */}
                                                    <button
                                                        type="button"
                                                        onClick={(e) => { e.stopPropagation(); toggleMedicationSelection(medication.id); }}
                                                        className={`h-5 w-5 rounded border-2 flex items-center justify-center transition-colors ${selectedMedications.has(medication.id)
                                                            ? 'bg-blue-600 border-blue-600 text-white'
                                                            : 'border-gray-300 hover:border-blue-400'
                                                            }`}
                                                    >
                                                        {selectedMedications.has(medication.id) && <Check className="h-3 w-3" />}
                                                    </button>
                                                    <div>
                                                        <div className="flex items-center gap-1.5">
                                                            <h4 className="font-semibold text-gray-900 text-sm">{medication.name}</h4>
                                                            {(() => {
                                                                const prescType = medication.prescriptionType || medication.prescription_type;
                                                                if (!prescType || prescType === 'padrao') return null;
                                                                return (
                                                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${prescType === 'A' ? 'bg-orange-100 text-orange-700' :
                                                                        prescType === 'B1' ? 'bg-blue-100 text-blue-700' :
                                                                            prescType === 'B2' ? 'bg-blue-100 text-blue-700' :
                                                                                prescType === 'C' ? 'bg-gray-100 text-gray-700' :
                                                                                    prescType === 'especial' ? 'bg-yellow-100 text-yellow-700' :
                                                                                        'bg-gray-100 text-gray-600'
                                                                        }`}>
                                                                        {prescType.toUpperCase()}
                                                                    </span>
                                                                );
                                                            })()}
                                                        </div>
                                                        <div className="text-xs text-gray-600 flex items-center gap-1 flex-wrap">
                                                            <span className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-medium text-gray-700">
                                                                {MEDICATION_FORMATS.find(f => f.value === medication.format)?.label || medication.format}
                                                            </span>
                                                            <span className="text-gray-300">•</span>
                                                            <span className="font-medium text-blue-700">{medication.dosage} {medication.dosageUnit || medication.dosage_unit}/vez</span>
                                                            <span className="text-gray-300">•</span>
                                                            <span>{medication.frequency}</span>
                                                        </div>
                                                        {medication.quantity && (
                                                            <div className="text-xs text-gray-500 mt-0.5">
                                                                📦 Qtd: <span className="font-medium">{medication.quantity}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-gray-400 hover:text-blue-600 h-7 w-7"
                                                        onClick={(e) => { e.stopPropagation(); openEditMedicationDialog(medication); }}
                                                    >
                                                        <FileText className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-gray-400 hover:text-red-600 h-7 w-7"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            deleteMedicationMutation.mutate(medication.id);
                                                        }}
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex gap-2 pt-2 border-t border-gray-100">
                                    <Button
                                        onClick={() => {
                                            setEditingMedication(null);
                                            medicationForm.reset();
                                            setIsMedicationDialogOpen(true);
                                        }}
                                        variant="outline"
                                        size="sm"
                                        className="gap-1 text-xs"
                                    >
                                        <PlusCircle className="h-3.5 w-3.5" />
                                        Adicionar
                                    </Button>
                                    <Button
                                        onClick={handleRenewPrescription}
                                        disabled={selectedMedications.size === 0 || createPrescriptionMutation.isPending}
                                        size="sm"
                                        className="flex-1 bg-green-600 hover:bg-green-700 text-white gap-1 text-xs"
                                    >
                                        <RefreshCw className="h-3.5 w-3.5" />
                                        {createPrescriptionMutation.isPending ? "Renovando..." : `Renovar Receita (${selectedMedications.size})`}
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-8 text-gray-400 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                                <Pill className="h-10 w-10 mb-2 opacity-20" />
                                <h3 className="text-sm font-medium text-gray-900">Nenhum medicamento</h3>
                                <p className="text-gray-500 text-xs mb-4">Adicione medicamentos de uso contínuo.</p>
                                <Button
                                    onClick={() => {
                                        setEditingMedication(null);
                                        medicationForm.reset();
                                        setIsMedicationDialogOpen(true);
                                    }}
                                    size="sm"
                                    className="bg-blue-600 hover:bg-blue-700 text-white gap-1 text-xs"
                                >
                                    <PlusCircle className="h-3.5 w-3.5" />
                                    Adicionar Medicamento
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* --- COLUNA DIREITA: RECEITUÁRIO --- */}
                <Card className={`border-green-100 shadow-md bg-gradient-to-b from-white to-green-50/20 h-fit ${editingPrescriptionId ? 'ring-2 ring-blue-400' : ''}`}>
                    <CardHeader className={`border-b pb-4 ${editingPrescriptionId ? 'bg-blue-50/50 border-blue-100' : 'bg-green-50/50 border-green-100'}`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-lg text-gray-900 flex items-center gap-2">
                                    {editingPrescriptionId ? (
                                        <>
                                            <Pencil className="h-5 w-5 text-blue-700" />
                                            Editando Receita
                                        </>
                                    ) : (
                                        <>
                                            <Stethoscope className="h-5 w-5 text-green-700" />
                                            Receituário
                                        </>
                                    )}
                                </CardTitle>
                                <CardDescription className="text-sm">
                                    {editingPrescriptionId
                                        ? "Modifique os medicamentos e clique em Salvar para atualizar."
                                        : "Medicamentos para tratamento específico desta consulta."}
                                </CardDescription>
                            </div>
                            {editingPrescriptionId && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-xs text-gray-600 hover:text-red-600"
                                    onClick={() => {
                                        setAcuteItems([]);
                                        setEditingPrescriptionId(null);
                                        setPrescriptionObservations("");
                                        toast({ title: "Edição cancelada", description: "A receita não foi alterada." });
                                    }}
                                >
                                    <Ban className="h-3 w-3 mr-1" /> Cancelar
                                </Button>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">
                        {/* Inline Medication Form */}
                        <div className="bg-green-50/50 rounded-lg border border-green-100 p-3 space-y-3">
                            {/* Medication Search */}
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-gray-700">Medicamento</label>
                                <Popover open={receituarioMedOpen} onOpenChange={setReceituarioMedOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={receituarioMedOpen}
                                            className={cn(
                                                "w-full justify-between font-normal h-9 text-sm bg-white",
                                                !receituarioForm.watch("name") && "text-muted-foreground"
                                            )}
                                        >
                                            <span className="flex items-center gap-2 truncate">
                                                {receituarioForm.watch("name") || "Buscar medicamento..."}
                                                {(() => {
                                                    const val = (receituarioForm.watch("name") || "").toLowerCase().trim();
                                                    if (!val) return null;

                                                    const isStandard = ALL_MEDICATIONS_WITH_PRESENTATIONS.some(
                                                        m => m.displayName.toLowerCase() === val || m.baseName.toLowerCase() === val
                                                    );
                                                    const isCustom = customMedications.some(m => m.name.toLowerCase() === val) || !isStandard;

                                                    if (isCustom) {
                                                        return (
                                                            <Badge variant="outline" className="text-[10px] px-1 py-0 border-blue-200 text-blue-600 bg-blue-50">
                                                                Personalizado
                                                            </Badge>
                                                        );
                                                    }
                                                    return null;
                                                })()}
                                            </span>
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[350px] p-0" align="start">
                                        <div className="flex items-center border-b px-3">
                                            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                                            <input
                                                className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
                                                placeholder="Buscar medicamento..."
                                                value={receituarioSearchValue}
                                                onChange={(e) => setReceituarioSearchValue(e.target.value)}
                                            />
                                        </div>
                                        <div className="max-h-[250px] overflow-y-auto p-1">
                                            {(() => {
                                                // Prepare Custom Medications for display
                                                const customItems = customMedications.map(med => ({
                                                    ...med,
                                                    displayName: med.name,
                                                    baseName: med.name,
                                                    prescriptionType: med.prescriptionType || 'padrao',
                                                    isCustom: true
                                                }));

                                                const allMedications = [...customItems, ...ALL_MEDICATIONS_WITH_PRESENTATIONS];

                                                const filtered = receituarioSearchValue
                                                    ? allMedications.filter(med =>
                                                        med.displayName.toLowerCase().includes(receituarioSearchValue.toLowerCase()) ||
                                                        (med.baseName && med.baseName.toLowerCase().includes(receituarioSearchValue.toLowerCase()))
                                                    )
                                                    : allMedications;

                                                if (filtered.length === 0) {
                                                    return (
                                                        <div className="py-4 text-center">
                                                            <p className="text-sm text-gray-500">Nenhum medicamento encontrado.</p>
                                                            {receituarioSearchValue && (
                                                                <div
                                                                    className="flex items-center gap-2 rounded-sm px-2 py-2 text-sm cursor-pointer hover:bg-blue-50 border-b mt-2 bg-gradient-to-r from-blue-50 to-transparent mx-2"
                                                                    onClick={() => {
                                                                        // Clear previous fields
                                                                        receituarioForm.reset();
                                                                        setReceituarioDose("");
                                                                        setReceituarioDoseUnit("comprimido");
                                                                        setReceituarioQuantity("");
                                                                        setReceituarioNotes("");
                                                                        setReceituarioDaysOfUse("7");

                                                                        receituarioForm.setValue("name", receituarioSearchValue);
                                                                        setReceituarioMedOpen(false);
                                                                        setReceituarioSearchValue("");
                                                                    }}
                                                                >
                                                                    <span className="text-blue-600">✏️</span>
                                                                    <span className="flex-1 text-blue-700 font-medium">
                                                                        Digitar manualmente: "{receituarioSearchValue}"
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                }

                                                return (
                                                    <>
                                                        {/* Opção de digitar manualmente - sempre visível */}
                                                        <div
                                                            className="flex items-center gap-2 rounded-sm px-2 py-2 text-sm cursor-pointer hover:bg-blue-50 border-b mb-1 bg-gradient-to-r from-blue-50 to-transparent"
                                                            onClick={() => {
                                                                // Clear previous fields
                                                                receituarioForm.reset();
                                                                setReceituarioDose("");
                                                                setReceituarioDoseUnit("comprimido");
                                                                setReceituarioQuantity("");
                                                                setReceituarioNotes("");
                                                                setReceituarioDaysOfUse("7");

                                                                if (receituarioSearchValue) {
                                                                    receituarioForm.setValue("name", receituarioSearchValue);

                                                                    // Auto-save as custom medication if not exists
                                                                    const exists = customMedications.some(m => m.name.toLowerCase() === receituarioSearchValue.toLowerCase()) ||
                                                                        ALL_MEDICATIONS_WITH_PRESENTATIONS.some(m => (m as any).name.toLowerCase() === receituarioSearchValue.toLowerCase());

                                                                    if (!exists) {
                                                                        createCustomMedicationMutation.mutate({ name: receituarioSearchValue });
                                                                    }
                                                                }
                                                                setReceituarioMedOpen(false);
                                                                setReceituarioSearchValue("");
                                                            }}
                                                        >
                                                            <span className="text-blue-600">✏️</span>
                                                            <span className="flex-1 text-blue-700 font-medium">
                                                                {receituarioSearchValue ? `Digitar manualmente: "${receituarioSearchValue}"` : "Digitar manualmente"}
                                                            </span>
                                                            <Badge variant="outline" className="text-[10px] px-1 py-0 border-blue-200 text-blue-600 bg-blue-50">
                                                                Personalizado
                                                            </Badge>
                                                        </div>
                                                        {filtered.map((med) => (
                                                            <div
                                                                key={med.displayName}
                                                                className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer hover:bg-green-50"
                                                                onClick={() => {
                                                                    // Determinar a unidade baseada no formato do medicamento
                                                                    const formatLower = (med.format || "").toLowerCase();
                                                                    let autoUnit = "cp"; // Default to comprimido code

                                                                    if (formatLower.includes('capsula') || formatLower.includes('cápsula')) {
                                                                        autoUnit = "cps";
                                                                    } else if (formatLower.includes('gotas')) {
                                                                        autoUnit = "gt";
                                                                    } else if (formatLower.includes('suspensao') || formatLower.includes('suspensão') ||
                                                                        formatLower.includes('solucao') || formatLower.includes('solução') ||
                                                                        formatLower.includes('xarope') || formatLower.includes('elixir')) {
                                                                        autoUnit = "ml";
                                                                    } else if (formatLower.includes('injecao') || formatLower.includes('injeção') ||
                                                                        formatLower.includes('ampola')) {
                                                                        autoUnit = "amp";
                                                                    } else if (formatLower.includes('sache') || formatLower.includes('sachê')) {
                                                                        autoUnit = "sache";
                                                                    } else if (formatLower.includes('adesivo')) {
                                                                        autoUnit = "adesivo";
                                                                    } else if (formatLower.includes('supositorio') || formatLower.includes('supositório')) {
                                                                        autoUnit = "supositorio";
                                                                    } else if (formatLower.includes('spray') || formatLower.includes('aerosol') ||
                                                                        formatLower.includes('inalador')) {
                                                                        autoUnit = "puff";
                                                                    } else if (formatLower.includes('creme') || formatLower.includes('pomada') ||
                                                                        formatLower.includes('gel') || formatLower.includes('loção') ||
                                                                        formatLower.includes('locao')) {
                                                                        autoUnit = "aplicacao";
                                                                    } else if (formatLower.includes('comprimido')) {
                                                                        autoUnit = "cp";
                                                                    }

                                                                    // Clear previous fields
                                                                    receituarioForm.reset();
                                                                    setReceituarioDose("");
                                                                    setReceituarioDoseUnit(autoUnit);
                                                                    setReceituarioQuantity("");
                                                                    setReceituarioNotes("");
                                                                    setReceituarioDaysOfUse("7");

                                                                    receituarioForm.setValue("name", med.displayName);
                                                                    receituarioForm.setValue("prescriptionType", (med as any).prescriptionType || "padrao");
                                                                    setReceituarioMedOpen(false);
                                                                    setReceituarioSearchValue("");
                                                                }}
                                                            >
                                                                <span className="text-base">{getMedicationIcon(med.format || "")}</span>
                                                                <span className="flex-1">{(med as any).displayName}</span>
                                                                {(med as any).isCustom && (
                                                                    <Badge variant="outline" className="text-[10px] px-1 py-0 border-blue-200 text-blue-600 bg-blue-50">
                                                                        Personalizado
                                                                    </Badge>
                                                                )}
                                                                {(med as any).prescriptionType && (med as any).prescriptionType !== 'common' && (med as any).prescriptionType !== 'padrao' && (
                                                                    <PrescriptionTypeBadge type={(med as any).prescriptionType} />
                                                                )}
                                                                {(med as any).isCustom && (
                                                                    <div
                                                                        role="button"
                                                                        className="ml-auto p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            deleteCustomMedicationMutation.mutate((med as any).id);
                                                                        }}
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </div>

                            {/* Dose per use with AI suggestions - split into value and unit */}
                            <div className="grid grid-cols-4 gap-2">
                                <div className="col-span-2 space-y-1">
                                    <label className="text-xs font-medium text-gray-700">Dose por vez *</label>
                                    <Popover open={receituarioDosePopoverOpen} onOpenChange={setReceituarioDosePopoverOpen}>
                                        <div className="relative">
                                            <Input
                                                className="h-9 text-sm bg-white pr-8"
                                                placeholder="Ex: 1, 10, 5"
                                                value={receituarioDose}
                                                onChange={(e) => setReceituarioDose(e.target.value)}
                                            />
                                            <PopoverTrigger asChild>
                                                <button
                                                    type="button"
                                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-green-600 hover:text-green-700 transition-colors"
                                                    onClick={() => {
                                                        const medName = receituarioForm.watch("name");
                                                        if (medName) setReceituarioDosePopoverOpen(true);
                                                    }}
                                                    title="Ver sugestões de dose"
                                                >
                                                    <Sparkles className="h-4 w-4" />
                                                </button>
                                            </PopoverTrigger>
                                        </div>
                                        {(() => {
                                            const medName = receituarioForm.watch("name");
                                            if (!medName) return null;

                                            // Find the base medication name (remove dosage info)
                                            const baseName = medName.split(" ")[0];
                                            const medInfo = MEDICATION_DATABASE.find(m =>
                                                m.name.toLowerCase() === baseName.toLowerCase()
                                            );

                                            if (!medInfo) return null;

                                            return (
                                                <PopoverContent className="w-[340px] p-0" align="start" side="bottom">
                                                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-2 border-b">
                                                        <div className="flex items-center gap-2 text-green-700">
                                                            <Sparkles className="h-4 w-4" />
                                                            <span className="font-medium text-sm">Sugestão IA</span>
                                                            <Badge variant="outline" className="text-xs ml-auto">{medInfo.category}</Badge>
                                                        </div>
                                                    </div>
                                                    <div className="p-2 max-h-[280px] overflow-y-auto">
                                                        {/* Apresentações para adultos */}
                                                        {medInfo.presentations.filter(p => !p.isPediatric).length > 0 && (
                                                            <>
                                                                {medInfo.presentations.filter(p => !p.isPediatric).map((pres, idx) => (
                                                                    <div
                                                                        key={`adult-${idx}`}
                                                                        className="flex items-center justify-between p-2 rounded-md cursor-pointer hover:bg-green-50 transition-colors"
                                                                        onClick={() => {
                                                                            const formatLower = pres.format.toLowerCase();

                                                                            // Para formas sólidas (comprimido, cápsula), usar "1" + formato
                                                                            if (formatLower.includes('comprimido') || formatLower.includes('capsula') || formatLower.includes('cápsula')) {
                                                                                setReceituarioDose("1");
                                                                                const unit = formatLower.includes('capsula') || formatLower.includes('cápsula')
                                                                                    ? "cps"
                                                                                    : "cp";
                                                                                setReceituarioDoseUnit(unit);
                                                                            } else if (formatLower.includes('gotas')) {
                                                                                // Para gotas, extrair número da commonDose ou usar 20 como padrão
                                                                                if (pres.commonDose) {
                                                                                    const match = pres.commonDose.match(/(\d+)[-–]?(\d+)?/);
                                                                                    if (match) {
                                                                                        setReceituarioDose(match[1]);
                                                                                    } else {
                                                                                        setReceituarioDose("20");
                                                                                    }
                                                                                } else {
                                                                                    setReceituarioDose("20");
                                                                                }
                                                                                setReceituarioDoseUnit("gt");
                                                                            } else if (formatLower.includes('suspensao') || formatLower.includes('suspensão') ||
                                                                                formatLower.includes('solucao') || formatLower.includes('solução') ||
                                                                                formatLower.includes('xarope')) {
                                                                                // Para líquidos, usar suggestedDose ou 5ml padrão
                                                                                setReceituarioDose(pres.suggestedDose || "5");
                                                                                setReceituarioDoseUnit(pres.suggestedUnit || "ml");
                                                                            } else if (formatLower.includes('injecao') || formatLower.includes('injeção') ||
                                                                                formatLower.includes('ampola')) {
                                                                                // Para injetáveis, usar "1" + ampola
                                                                                setReceituarioDose("1");
                                                                                setReceituarioDoseUnit("amp");
                                                                            } else if (pres.suggestedDose && pres.suggestedUnit) {
                                                                                // Fallback para suggestedDose/Unit se existir
                                                                                setReceituarioDose(pres.suggestedDose);
                                                                                // Map common full names to codes if necessary
                                                                                let u = pres.suggestedUnit.toLowerCase();
                                                                                if (u === 'ampola') u = 'amp';
                                                                                if (u === 'comprimido') u = 'cp';
                                                                                if (u === 'cápsula' || u === 'capsula') u = 'cps';
                                                                                if (u === 'gotas') u = 'gt';
                                                                                setReceituarioDoseUnit(u);
                                                                            } else {
                                                                                // Último fallback: 1 + formato
                                                                                setReceituarioDose("1");
                                                                                let u = pres.format.toLowerCase() || "cp";
                                                                                if (u === 'ampola') u = 'amp';
                                                                                if (u === 'comprimido') u = 'cp';
                                                                                if (u === 'cápsula' || u === 'capsula') u = 'cps';
                                                                                if (u === 'gotas') u = 'gt';
                                                                                setReceituarioDoseUnit(u);
                                                                            }
                                                                            setReceituarioDosePopoverOpen(false);
                                                                        }}
                                                                    >
                                                                        <div>
                                                                            <span className="font-semibold text-gray-900">{pres.dosage}{pres.unit}</span>
                                                                            <span className="text-gray-500 ml-2 text-sm">
                                                                                ({MEDICATION_FORMATS.find(f => f.value === pres.format)?.label || pres.format})
                                                                            </span>
                                                                        </div>
                                                                        {pres.commonDose && (
                                                                            <span className="text-xs text-gray-500">{pres.commonDose}</span>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </>
                                                        )}

                                                        {/* Seção pediátrica com campo de peso integrado */}
                                                        {medInfo.presentations.filter(p => p.isPediatric).length > 0 && (
                                                            <div className="mt-2 pt-2 border-t">
                                                                <div className="flex items-center justify-between px-2 py-1">
                                                                    <span className="text-xs text-purple-600 font-medium">👶 Pediátrico</span>
                                                                    <div className="flex items-center gap-1">
                                                                        <Input
                                                                            type="number"
                                                                            placeholder="Peso"
                                                                            value={receituarioPatientWeight}
                                                                            onChange={(e) => setReceituarioPatientWeight(e.target.value)}
                                                                            className="h-6 w-16 text-xs px-2"
                                                                            min="0"
                                                                            step="0.1"
                                                                        />
                                                                        <span className="text-xs text-gray-500">kg</span>
                                                                    </div>
                                                                </div>
                                                                {medInfo.presentations.filter(p => p.isPediatric).map((pres, idx) => {
                                                                    const weight = parseFloat(receituarioPatientWeight);
                                                                    const calculation = weight > 0 ? calculatePediatricDose(pres, weight) : null;

                                                                    return (
                                                                        <div
                                                                            key={`ped-${idx}`}
                                                                            className="p-2 rounded-md cursor-pointer hover:bg-purple-50 transition-colors border-l-2 border-purple-200 ml-2 mt-1"
                                                                            onClick={() => {
                                                                                if (calculation) {
                                                                                    const doseValue = calculation.mlPerAdminLow === calculation.mlPerAdminHigh
                                                                                        ? `${calculation.mlPerAdminLow}`
                                                                                        : `${calculation.mlPerAdminLow}-${calculation.mlPerAdminHigh}`;
                                                                                    setReceituarioDose(doseValue);
                                                                                    setReceituarioDoseUnit("ml");
                                                                                    setReceituarioDosePopoverOpen(false);
                                                                                } else {
                                                                                    if (pres.suggestedDose && pres.suggestedUnit) {
                                                                                        setReceituarioDose(pres.suggestedDose);
                                                                                        setReceituarioDoseUnit(pres.suggestedUnit);
                                                                                    } else {
                                                                                        setReceituarioDose(`${pres.dosage}`);
                                                                                        setReceituarioDoseUnit("ml");
                                                                                    }
                                                                                    setReceituarioDosePopoverOpen(false);
                                                                                }
                                                                            }}
                                                                        >
                                                                            <div className="flex items-center justify-between">
                                                                                <div className="flex items-center gap-1">
                                                                                    <span className="font-semibold text-gray-900 text-sm">{pres.dosage}</span>
                                                                                    {pres.format && (
                                                                                        <span className="text-gray-500 font-normal text-xs">
                                                                                            ({MEDICATION_FORMATS.find(f => f.value === pres.format)?.label || pres.format})
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                                {calculation ? (
                                                                                    <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded">
                                                                                        {calculation.mlPerAdminLow === calculation.mlPerAdminHigh
                                                                                            ? `${calculation.mlPerAdminLow}ml`
                                                                                            : `${calculation.mlPerAdminLow}-${calculation.mlPerAdminHigh}ml`
                                                                                        } / dose
                                                                                    </span>
                                                                                ) : (
                                                                                    // Fallback logic if no calculation possible (or no weight)
                                                                                    pres.dosePerKg ? (
                                                                                        // Has calc params, waiting for weight
                                                                                        <span className="text-xs text-purple-400 italic">informe peso</span>
                                                                                    ) : (
                                                                                        // No calc params (Fixed dose or Manual), show suggestion if exists
                                                                                        pres.suggestedDose ? (
                                                                                            <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                                                                                                {pres.suggestedDose}{pres.suggestedUnit || "ml"} (Fixo)
                                                                                            </span>
                                                                                        ) : (
                                                                                            <span className="text-xs text-gray-400 italic">Ver bula</span>
                                                                                        )
                                                                                    )
                                                                                )}
                                                                            </div>
                                                                            <div className="text-xs text-gray-500">{pres.commonDose}</div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="bg-gray-50 p-2 border-t">
                                                        <p className="text-[10px] text-gray-400 text-center">
                                                            ⚕️ Sugestões baseadas em referências gerais.
                                                        </p>
                                                    </div>
                                                </PopoverContent>
                                            );
                                        })()}
                                    </Popover>
                                </div>
                                {/* Unit selector */}
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-gray-700">Unidade</label>
                                    <Select value={receituarioDoseUnit} onValueChange={setReceituarioDoseUnit}>
                                        <SelectTrigger className="h-9 text-sm bg-white">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {DOSAGE_UNITS.map((unit) => (
                                                <SelectItem key={unit.value} value={unit.value}>
                                                    {unit.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                {/* Type selector */}
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-gray-700">Tipo</label>
                                    <Select
                                        value={receituarioForm.watch("prescriptionType")}
                                        onValueChange={(val) => receituarioForm.setValue("prescriptionType", val as any)}
                                    >
                                        <SelectTrigger className="h-9 text-sm bg-white">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {PRESCRIPTION_TYPES.map((type) => (
                                                <SelectItem key={type.value} value={type.value}>
                                                    {type.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Frequency, Days and Quantity Row */}
                            <div className="grid grid-cols-3 gap-2">
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-gray-700">Frequência</label>
                                    <Select
                                        value={receituarioForm.watch("frequency")}
                                        onValueChange={(val) => receituarioForm.setValue("frequency", val)}
                                    >
                                        <SelectTrigger className="h-9 text-sm bg-white">
                                            <SelectValue placeholder="Selecione" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {FREQUENCIES.map((freq) => (
                                                <SelectItem key={freq.value} value={freq.value}>
                                                    {freq.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-gray-700">Dias de uso</label>
                                    <Input
                                        type="number"
                                        className="h-9 text-sm bg-white"
                                        value={receituarioDaysOfUse}
                                        onChange={(e) => setReceituarioDaysOfUse(e.target.value)}
                                        min="1"
                                        placeholder="7"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-gray-700">Quantidade</label>
                                    <Input
                                        className="h-9 text-sm bg-white"
                                        value={receituarioQuantity}
                                        onChange={(e) => setReceituarioQuantity(e.target.value)}
                                        placeholder="Calc. Auto"
                                    />
                                </div>
                            </div>

                            {/* Notes */}
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-gray-700">Observações (opcional)</label>
                                <Input
                                    className="h-9 text-sm bg-white"
                                    placeholder="Ex: Tomar com alimento"
                                    value={receituarioNotes}
                                    onChange={(e) => setReceituarioNotes(e.target.value)}
                                />
                            </div>

                            {/* Add Button */}
                            <Button
                                className="w-full h-9 bg-green-600 hover:bg-green-700 text-white text-sm gap-2"
                                onClick={() => addMedicationToReceituario(
                                    receituarioForm.watch("name"),
                                    receituarioForm.watch("frequency"),
                                    receituarioDose,
                                    receituarioDoseUnit,
                                    receituarioQuantity
                                )}
                                disabled={!receituarioForm.watch("name") || !receituarioForm.watch("frequency") || !receituarioDose}
                            >
                                <PlusCircle className="h-4 w-4" />
                                Adicionar à Receita
                            </Button>
                        </div>

                        {/* Prescription Items List */}
                        <div className="bg-white rounded-lg border border-gray-200 min-h-[120px] flex flex-col">
                            <div className="p-2 border-b bg-gray-50 flex justify-between items-center rounded-t-lg">
                                <span className="font-medium text-xs text-gray-700">Itens da Receita ({acuteItems.length})</span>
                                {acuteItems.length > 0 && <Button variant="ghost" size="sm" className="text-xs text-red-500 h-6 px-2" onClick={() => setAcuteItems([])}>Limpar</Button>}
                            </div>
                            <div className="p-2 space-y-2 flex-1 max-h-[180px] overflow-y-auto">
                                {acuteItems.length > 0 ? (
                                    acuteItems.map((item, idx) => (
                                        <div key={item.id} className="flex items-start justify-between p-2 bg-gray-50 rounded-lg border border-gray-100 group">
                                            <div className="flex items-start gap-2">
                                                <div className="bg-green-100 text-green-700 h-5 w-5 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                                                    {idx + 1}
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-gray-900 text-sm flex items-center gap-1.5">
                                                        {item.name} <span className="font-normal text-gray-600">({item.dosage})</span>
                                                        <PrescriptionTypeBadge type={item.prescriptionType === 'padrao' ? undefined : item.prescriptionType} />
                                                    </div>
                                                    <p className="text-xs text-gray-600">{item.frequency} • <span className="text-green-600 font-medium">{item.daysOfUse} dias</span> {item.quantity && <span>• {item.quantity}</span>}</p>
                                                    {item.notes && <p className="text-xs text-gray-500 mt-0.5 italic">{item.notes}</p>}
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="icon" className="h-5 w-5 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeAcuteItem(item.id)}>
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    ))
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-gray-300 gap-1 min-h-[80px]">
                                        <FileText className="h-6 w-6 opacity-20" />
                                        <p className="text-xs">Nenhum item adicionado</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-2 items-end">
                            <Button
                                className={`flex-1 h-9 text-sm shadow-lg ${editingPrescriptionId ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-200' : 'bg-green-600 hover:bg-green-700 shadow-green-200'}`}
                                onClick={handleSaveAndPrintPrescription}
                                disabled={createPrescriptionMutation.isPending || updatePrescriptionMutation.isPending || acuteItems.length === 0 || !user}
                            >
                                <Printer className="h-4 w-4 mr-1" />
                                {(createPrescriptionMutation.isPending || updatePrescriptionMutation.isPending)
                                    ? "Salvando..."
                                    : editingPrescriptionId
                                        ? "Atualizar e Imprimir"
                                        : "Salvar e Imprimir"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* --- HISTÓRICO --- */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <History className="h-5 w-5 text-gray-600" />
                        Histórico de Prescrições
                    </CardTitle>
                    <CardDescription className="text-sm">Receitas emitidas para este paciente.</CardDescription>
                </CardHeader>
                <CardContent>
                    {prescriptionHistory.length > 0 ? (
                        <div className="space-y-2">
                            {prescriptionHistory.map(p => (
                                <div key={p.id} className={`flex items-center justify-between p-3 rounded-lg border ${p.status === 'cancelled' ? 'bg-red-50 border-red-100 opacity-70' : 'bg-white border-gray-100 shadow-sm'}`}>
                                    <div className="flex gap-3 items-center">
                                        <div className="bg-green-100 p-2 rounded-full hidden sm:block">
                                            <FileText className="h-4 w-4 text-green-700" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900 text-sm">{formatMedicationNames(p.medications as any[])}</p>
                                            <p className="text-xs text-gray-500">{format(new Date(p.issueDate), "dd/MM/yyyy")} • Dr(a). {p.doctorName}</p>
                                            {p.status === 'cancelled' && <span className="text-xs text-red-600 font-bold">CANCELADA</span>}
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        {p.status === 'active' && (
                                            <>
                                                <Button variant="ghost" size="sm" className="h-8 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={() => handleEditPrescription(p)}>
                                                    <Pencil className="h-3 w-3 mr-1" /> Editar
                                                </Button>
                                                <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => handleReprintPrescription(p)}>
                                                    <Printer className="h-3 w-3 mr-1" /> Reimprimir
                                                </Button>
                                            </>
                                        )}
                                        {p.status === 'cancelled' && (
                                            <Button disabled variant="outline" size="sm" className="h-8 opacity-50 text-xs">Cancelado</Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500 italic">Nenhuma receita encontrada.</p>
                    )}
                </CardContent>
            </Card>

            {/* Dialog para Medicamentos de Uso Contínuo */}
            <MedicationDialog
                open={isMedicationDialogOpen}
                onOpenChange={(open) => {
                    setIsMedicationDialogOpen(open);
                    if (!open) setEditingMedication(null);
                }}
                form={editingMedication ? editMedicationForm : medicationForm}
                onSubmit={onMedicationSubmit}
                isPending={editingMedication ? editMedicationMutation.isPending : addMedicationMutation.isPending}
                mode={editingMedication ? "edit" : "create"}
                onRemove={editingMedication ? () => deleteMedicationMutation.mutate(editingMedication.id) : undefined}
                isRemovePending={deleteMedicationMutation.isPending}
            />
        </div >
    );
}
