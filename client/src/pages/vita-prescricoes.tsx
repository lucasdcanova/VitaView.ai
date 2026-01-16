import { useState } from "react";
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
    RefreshCw
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { medicationSchema, MedicationDialog, type MedicationFormData } from "@/components/dialogs";
import { format } from "date-fns";
import type { Profile, Prescription } from "@shared/schema";

interface AcutePrescriptionItem {
    id: string;
    name: string;
    dosage: string;
    frequency: string;
    notes?: string;
}

interface VitaPrescriptionsProps {
    patient: Profile;
}

export default function VitaPrescriptions({ patient }: VitaPrescriptionsProps) {
    const { toast } = useToast();
    const { user } = useAuth();
    const queryClient = useQueryClient();

    // --- Continuous Medications State ---
    const [isMedicationDialogOpen, setIsMedicationDialogOpen] = useState(false);
    const [editingMedication, setEditingMedication] = useState<any>(null);
    const [selectedMedications, setSelectedMedications] = useState<Set<number>>(new Set());

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

    // --- Prescription State ---
    const [acuteItems, setAcuteItems] = useState<AcutePrescriptionItem[]>([]);
    const [currentAcuteItem, setCurrentAcuteItem] = useState<Partial<AcutePrescriptionItem>>({});
    const [prescriptionValidity, setPrescriptionValidity] = useState("30");
    const [prescriptionObservations, setPrescriptionObservations] = useState("");

    const isCurrentAcuteItemComplete = Boolean(
        currentAcuteItem.name && currentAcuteItem.dosage && currentAcuteItem.frequency
    );

    // History Queries
    const { data: prescriptionHistory = [] } = useQuery<Prescription[]>({
        queryKey: [`/api/prescriptions/patient/${patient.id}`],
        enabled: !!patient.id
    });

    // Fetches patient allergies
    const { data: allergies = [] } = useQuery<any[]>({
        queryKey: [`/api/allergies/patient/${patient.id}`],
        enabled: !!patient.id
    });

    // Fetches continuous medications
    const { data: medications = [] } = useQuery<any[]>({
        queryKey: ["/api/medications"],
    });

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

            // Generate PDF with saved data
            generatePrescriptionPDF({
                doctorName: savedData.doctorName,
                doctorCrm: savedData.doctorCrm,
                doctorSpecialty: savedData.doctorSpecialty || undefined,
                patientName: patient.name,
                issueDate: new Date(savedData.issueDate),
                validUntil: new Date(savedData.validUntil),
                medications: savedData.medications as any[], // stored as JSON
                observations: savedData.observations || undefined
            });

            toast({ title: "Sucesso", description: "Receita salva e gerada!" });
            setAcuteItems([]);
            setCurrentAcuteItem({});
        },
        onError: (err) => {
            console.error(err);
            toast({ title: "Erro", description: "Falha ao salvar receita.", variant: "destructive" });
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
        onError: () => {
            toast({ title: "Erro", description: "Erro ao adicionar medicamento.", variant: "destructive" });
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
        onError: () => {
            toast({ title: "Erro", description: "Erro ao atualizar medicamento.", variant: "destructive" });
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

    // Acute Prescription Handlers
    const addAcuteItem = () => {
        if (!currentAcuteItem.name || !currentAcuteItem.dosage || !currentAcuteItem.frequency) {
            toast({ title: "Campos incompletos", description: "Preencha nome, dose e frequência.", variant: "destructive" });
            return;
        }
        const newItem: AcutePrescriptionItem = {
            id: Math.random().toString(36).substr(2, 9),
            name: currentAcuteItem.name,
            dosage: currentAcuteItem.dosage,
            frequency: currentAcuteItem.frequency,
            notes: currentAcuteItem.notes
        };
        setAcuteItems([...acuteItems, newItem]);
        setCurrentAcuteItem({});
    };

    const removeAcuteItem = (id: string) => {
        setAcuteItems(acuteItems.filter(i => i.id !== id));
    };

    const handleSaveAndPrintPrescription = async () => {
        if (acuteItems.length === 0 && !isCurrentAcuteItemComplete) {
            toast({ title: "Prescrição vazia", description: "Adicione pelo menos um medicamento.", variant: "destructive" });
            return;
        }

        if (!user) {
            toast({ title: "Erro", description: "Usuário não identificado. Faça login novamente.", variant: "destructive" });
            return;
        }

        const itemsToSave = acuteItems.length > 0 ? acuteItems : [{
            id: "single-item",
            name: currentAcuteItem.name as string,
            dosage: currentAcuteItem.dosage as string,
            frequency: currentAcuteItem.frequency as string,
            notes: currentAcuteItem.notes
        }];

        const doctorName = user.fullName || user.username || "Dr. VitaView";
        const doctorCrm = user.crm || "CRM pendente";
        const doctorSpecialty = user.specialty || "Clínica Médica";

        createPrescriptionMutation.mutate({
            profileId: patient.id,
            userId: patient.userId,
            doctorName,
            doctorCrm,
            doctorSpecialty,
            medications: itemsToSave.map(item => ({
                name: item.name,
                dosage: item.dosage,
                frequency: item.frequency,
                notes: item.notes
            })),
            issueDate: new Date().toISOString(),
            validUntil: new Date(Date.now() + parseInt(prescriptionValidity) * 24 * 60 * 60 * 1000).toISOString(),
            observations: prescriptionObservations || undefined,
            status: 'active'
        });
    };

    const handleReprintPrescription = (p: Prescription) => {
        generatePrescriptionPDF({
            doctorName: p.doctorName,
            doctorCrm: p.doctorCrm,
            doctorSpecialty: p.doctorSpecialty || undefined,
            patientName: patient.name,
            issueDate: new Date(p.issueDate),
            validUntil: new Date(p.validUntil),
            medications: p.medications as any[],
            observations: p.observations || undefined
        });
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

        const selectedMeds = medications.filter((med: any) => selectedMedications.has(med.id));
        const doctorName = user.fullName || user.username || "Dr. VitaView";
        const doctorCrm = user.crm || "CRM pendente";
        const doctorSpecialty = user.specialty || "Clínica Médica";

        createPrescriptionMutation.mutate({
            profileId: patient.id,
            userId: patient.userId,
            doctorName,
            doctorCrm,
            doctorSpecialty,
            medications: selectedMeds.map((med: any) => ({
                name: med.name,
                dosage: `${med.dosage}${med.dosageUnit || med.dosage_unit || ''}${(med.doseAmount > 1 || med.dose_amount > 1) ? ` (${med.doseAmount || med.dose_amount} ${med.format}s)` : ''}`,
                frequency: med.frequency,
                format: med.format,
                quantity: med.quantity,
                prescriptionType: med.prescriptionType || med.prescription_type || 'padrao',
                notes: med.notes
            })),
            issueDate: new Date().toISOString(),
            validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            observations: "Renovação de medicamentos de uso contínuo",
            status: 'active'
        });

        setSelectedMedications(new Set());
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
            {/* Header & Allergies - Integrated Row */}
            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                {/* Allergies Warning (Left side if present, otherwise empty space keeps alignment) */}
                <div className="flex-1 w-full">
                    {allergies.length > 0 && (
                        <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded-md flex items-start h-full">
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
                </div>

                {/* Professional Info (Right side) */}
                <div className="w-full md:w-auto min-w-[250px] bg-white px-4 py-2 rounded-lg border border-gray-100 shadow-sm flex flex-col items-end flex-shrink-0">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-0.5">Médico Prescritor</span>
                    <p className="font-semibold text-gray-900 text-sm">{user?.fullName || user?.username || "Profissional"}</p>
                    {user?.crm && <span className="text-xs text-blue-600 font-medium bg-blue-50 px-1.5 py-0.5 rounded">CRM: {user.crm}</span>}
                </div>
            </div>

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
                                                            <span className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-medium text-gray-700">{medication.format}</span>
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

                {/* --- COLUNA DIREITA: RECEITA AGUDA --- */}
                <Card className="border-green-100 shadow-md bg-gradient-to-b from-white to-green-50/20 h-fit">
                    <CardHeader className="bg-green-50/50 border-b border-green-100 pb-4">
                        <CardTitle className="text-lg text-gray-900 flex items-center gap-2">
                            <Stethoscope className="h-5 w-5 text-green-700" />
                            Receita da Consulta
                        </CardTitle>
                        <CardDescription className="text-sm">Medicamentos para tratamento específico.</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">
                        {/* Add Item Form */}
                        <div className="p-3 bg-white rounded-lg border border-gray-200 shadow-sm space-y-3">
                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1 col-span-2">
                                    <label className="text-xs font-medium text-gray-500">Medicamento</label>
                                    <Input
                                        placeholder="Ex: Amoxicilina 500mg"
                                        value={currentAcuteItem.name || ""}
                                        onChange={e => setCurrentAcuteItem({ ...currentAcuteItem, name: e.target.value })}
                                        className="h-9 text-sm"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-gray-500">Dose</label>
                                    <Input
                                        placeholder="Ex: 1 comp"
                                        value={currentAcuteItem.dosage || ""}
                                        onChange={e => setCurrentAcuteItem({ ...currentAcuteItem, dosage: e.target.value })}
                                        className="h-9 text-sm"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-gray-500">Posologia</label>
                                    <Input
                                        placeholder="Ex: 8/8h por 7 dias"
                                        value={currentAcuteItem.frequency || ""}
                                        onChange={e => setCurrentAcuteItem({ ...currentAcuteItem, frequency: e.target.value })}
                                        className="h-9 text-sm"
                                    />
                                </div>
                                <div className="space-y-1 col-span-2">
                                    <label className="text-xs font-medium text-gray-500">Observação (opcional)</label>
                                    <Input
                                        placeholder="Instruções adicionais"
                                        value={currentAcuteItem.notes || ""}
                                        onChange={e => setCurrentAcuteItem({ ...currentAcuteItem, notes: e.target.value })}
                                        className="h-9 text-sm"
                                    />
                                </div>
                            </div>
                            <Button
                                className="w-full bg-green-600 hover:bg-green-700 text-white h-9 text-sm"
                                onClick={addAcuteItem}
                                disabled={!isCurrentAcuteItemComplete}
                            >
                                <PlusCircle className="h-4 w-4 mr-1" />
                                Adicionar à Receita
                            </Button>
                        </div>

                        {/* Prescription Items List */}
                        <div className="bg-white rounded-lg border border-gray-200 min-h-[150px] flex flex-col">
                            <div className="p-2 border-b bg-gray-50 flex justify-between items-center rounded-t-lg">
                                <span className="font-medium text-xs text-gray-700">Itens da Receita ({acuteItems.length})</span>
                                {acuteItems.length > 0 && <Button variant="ghost" size="sm" className="text-xs text-red-500 h-6 px-2" onClick={() => setAcuteItems([])}>Limpar</Button>}
                            </div>
                            <div className="p-2 space-y-2 flex-1 max-h-[200px] overflow-y-auto">
                                {acuteItems.length > 0 ? (
                                    acuteItems.map((item, idx) => (
                                        <div key={item.id} className="flex items-start justify-between p-2 bg-gray-50 rounded-lg border border-gray-100 group">
                                            <div className="flex items-start gap-2">
                                                <div className="bg-green-100 text-green-700 h-5 w-5 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                                                    {idx + 1}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-900 text-sm">{item.name} <span className="font-normal text-gray-600 text-xs">({item.dosage})</span></p>
                                                    <p className="text-xs text-gray-600">{item.frequency}</p>
                                                    {item.notes && <p className="text-xs text-gray-500 mt-0.5 italic">{item.notes}</p>}
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="icon" className="h-5 w-5 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeAcuteItem(item.id)}>
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    ))
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-gray-300 gap-1 min-h-[100px]">
                                        <FileText className="h-6 w-6 opacity-20" />
                                        <p className="text-xs">Nenhum item adicionado</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-2 items-end">
                            <div className="space-y-1 w-[120px]">
                                <label className="text-xs font-medium text-gray-500">Validade</label>
                                <Select value={prescriptionValidity} onValueChange={setPrescriptionValidity}>
                                    <SelectTrigger className="h-9 text-sm">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="30">30 dias</SelectItem>
                                        <SelectItem value="60">60 dias</SelectItem>
                                        <SelectItem value="90">90 dias</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button
                                className="flex-1 h-9 text-sm shadow-lg shadow-green-200 bg-green-600 hover:bg-green-700"
                                onClick={handleSaveAndPrintPrescription}
                                disabled={createPrescriptionMutation.isPending || (!isCurrentAcuteItemComplete && acuteItems.length === 0) || !user}
                            >
                                <Printer className="h-4 w-4 mr-1" />
                                {createPrescriptionMutation.isPending ? "Salvando..." : "Salvar e Imprimir"}
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
                                            <p className="font-medium text-gray-900 text-sm">Receita Médica - {format(new Date(p.issueDate), "dd/MM/yyyy")}</p>
                                            <p className="text-xs text-gray-500">Dr(a). {p.doctorName} • {(p.medications as any[]).length} med(s)</p>
                                            {p.status === 'cancelled' && <span className="text-xs text-red-600 font-bold">CANCELADA</span>}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        {p.status === 'active' && (
                                            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => handleReprintPrescription(p)}>
                                                <Printer className="h-3 w-3 mr-1" /> Re-Imprimir
                                            </Button>
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
        </div>
    );
}
