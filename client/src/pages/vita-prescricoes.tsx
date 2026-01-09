import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest } from "@/lib/queryClient";
import { generatePrescriptionPDF } from "@/lib/prescription-pdf";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Pill,
    AlertTriangle,
    PlusCircle,
    FileText,
    Trash2,
    Edit2,
    ChefHat,
    Stethoscope,
    XCircle,
    CheckCircle2,
    Printer,
    RotateCcw
} from "lucide-react";
import {
    MedicationDialog,
    AllergyDialog,
    DoctorDialog,
    PrescriptionDialog,
    medicationSchema,
    allergySchema,
    doctorSchema,
    type MedicationFormData,
    type AllergyFormData,
    type DoctorFormData
} from "@/components/dialogs";

// Types
type MedicationForm = MedicationFormData;
type AllergyForm = AllergyFormData;
type DoctorForm = DoctorFormData;

interface AcutePrescriptionItem {
    id: string;
    name: string;
    dosage: string;
    frequency: string;
    notes?: string;
}

export default function VitaPrescriptions() {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // State for Dialogs
    const [isMedicationDialogOpen, setIsMedicationDialogOpen] = useState(false);
    const [isEditMedicationDialogOpen, setIsEditMedicationDialogOpen] = useState(false);
    const [editingMedication, setEditingMedication] = useState<any>(null);

    const [isAllergyDialogOpen, setIsAllergyDialogOpen] = useState(false);
    const [isEditAllergyDialogOpen, setIsEditAllergyDialogOpen] = useState(false);
    const [editingAllergy, setEditingAllergy] = useState<any>(null);

    const [isPrescriptionDialogOpen, setIsPrescriptionDialogOpen] = useState(false);

    const [isDoctorFormDialogOpen, setIsDoctorFormDialogOpen] = useState(false);

    // State for Acute Prescription
    const [acuteItems, setAcuteItems] = useState<AcutePrescriptionItem[]>([]);
    const [currentAcuteItem, setCurrentAcuteItem] = useState<Partial<AcutePrescriptionItem>>({});
    const [selectedDoctorId, setSelectedDoctorId] = useState<string>("");
    const [prescriptionValidity, setPrescriptionValidity] = useState("30");
    const [prescriptionObservations, setPrescriptionObservations] = useState("");

    // Queries
    const { data: medications = [], isLoading: medicationsLoading } = useQuery<any[]>({
        queryKey: ["/api/medications"],
    });

    const { data: allergies = [], isLoading: allergiesLoading } = useQuery<any[]>({
        queryKey: ["/api/allergies"],
    });

    const { data: doctors = [], isLoading: doctorsLoading } = useQuery<any[]>({
        queryKey: ["/api/doctors"],
    });

    // Forms
    const medicationForm = useForm<MedicationForm>({
        resolver: zodResolver(medicationSchema),
        defaultValues: { name: "", format: "comprimido", dosage: "", dosageUnit: "mg", frequency: "", startDate: new Date().toISOString().split('T')[0], notes: "" },
    });

    const editMedicationForm = useForm<MedicationForm>({
        resolver: zodResolver(medicationSchema),
        defaultValues: { name: "", format: "comprimido", dosage: "", dosageUnit: "mg", frequency: "", startDate: "", notes: "" },
    });

    const allergyForm = useForm<AllergyForm>({
        resolver: zodResolver(allergySchema),
        defaultValues: { allergen: "", allergenType: "medication", reaction: "", severity: undefined, notes: "" },
    });

    const editAllergyForm = useForm<AllergyForm>({
        resolver: zodResolver(allergySchema),
        defaultValues: { allergen: "", allergenType: "medication", reaction: "", severity: undefined, notes: "" },
    });

    const doctorForm = useForm<DoctorForm>({
        resolver: zodResolver(doctorSchema),
        defaultValues: { name: "", crm: "", specialty: "", isDefault: false },
    });

    // ------------ Mutations ------------

    // Medication
    const addMedicationMutation = useMutation({
        mutationFn: (data: MedicationForm) => apiRequest("POST", "/api/medications", data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/medications"] });
            medicationForm.reset();
            setIsMedicationDialogOpen(false);
            toast({ title: "Sucesso", description: "Medicamento adicionado!" });
        },
        onError: () => toast({ title: "Erro", description: "Falha ao adicionar medicamento.", variant: "destructive" }),
    });

    const editMedicationMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: MedicationForm }) => apiRequest("PUT", `/api/medications/${id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/medications"] });
            editMedicationForm.reset();
            setIsEditMedicationDialogOpen(false);
            setEditingMedication(null);
            toast({ title: "Sucesso", description: "Medicamento atualizado!" });
        },
        onError: () => toast({ title: "Erro", description: "Falha ao atualizar.", variant: "destructive" }),
    });

    const deleteMedicationMutation = useMutation({
        mutationFn: (id: number) => apiRequest("DELETE", `/api/medications/${id}`, {}),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/medications"] });
            toast({ title: "Sucesso", description: "Medicamento removido." });
        },
        onError: () => toast({ title: "Erro", description: "Falha ao remover.", variant: "destructive" }),
    });

    // Allergy
    const addAllergyMutation = useMutation({
        mutationFn: (data: AllergyForm) => apiRequest("POST", "/api/allergies", data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/allergies"] });
            allergyForm.reset();
            setIsAllergyDialogOpen(false);
            toast({ title: "Sucesso", description: "Alergia registrada!" });
        },
        onError: () => toast({ title: "Erro", description: "Falha ao registrar alergia.", variant: "destructive" }),
    });

    const editAllergyMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: AllergyForm }) => apiRequest("PUT", `/api/allergies/${id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/allergies"] });
            setIsEditAllergyDialogOpen(false);
            setEditingAllergy(null);
            toast({ title: "Sucesso", description: "Alergia atualizada!" });
        },
        onError: () => toast({ title: "Erro", description: "Falha ao atualizar.", variant: "destructive" }),
    });

    const deleteAllergyMutation = useMutation({
        mutationFn: (id: number) => apiRequest("DELETE", `/api/allergies/${id}`, {}),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/allergies"] });
            toast({ title: "Sucesso", description: "Alergia removida." });
        },
        onError: () => toast({ title: "Erro", description: "Falha ao remover.", variant: "destructive" }),
    });

    // Doctor
    const createDoctorMutation = useMutation({
        mutationFn: (data: DoctorForm) => apiRequest("POST", "/api/doctors", data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/doctors"] });
            doctorForm.reset();
            setIsDoctorFormDialogOpen(false);
            toast({ title: "Médico cadastrado", description: "Novo profissional adicionado." });
        },
        onError: () => toast({ title: "Erro", description: "Falha ao cadastrar médico.", variant: "destructive" }),
    });


    // ------------ Handlers ------------

    const handleEditMedication = (med: any) => {
        setEditingMedication(med);
        editMedicationForm.reset({
            name: med.name,
            format: med.format,
            dosage: med.dosage,
            dosageUnit: "mg", // Default or extract
            frequency: med.frequency,
            startDate: med.startDate ? med.startDate.split('T')[0] : "",
            notes: med.notes || "",
        });
        setIsEditMedicationDialogOpen(true);
    };

    const handleEditAllergy = (al: any) => {
        setEditingAllergy(al);
        editAllergyForm.reset({
            allergen: al.allergen,
            allergenType: al.allergenType,
            reaction: al.reaction || "",
            severity: al.severity,
            notes: al.notes || "",
        });
        setIsEditAllergyDialogOpen(true);
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

    const handleGeneratePrescription = async () => {
        if (acuteItems.length === 0) {
            toast({ title: "Prescrição vazia", description: "Adicione pelo menos um medicamento.", variant: "destructive" });
            return;
        }
        if (!selectedDoctorId) {
            toast({ title: "Médico não selecionado", description: "Selecione um médico responsável.", variant: "destructive" });
            return;
        }

        const doctor = doctors.find(d => d.id.toString() === selectedDoctorId);
        if (!doctor) return;

        try {
            toast({ title: "Gerando PDF...", description: "Preparando documento..." });

            generatePrescriptionPDF({
                doctorName: doctor.name,
                doctorCrm: doctor.crm,
                doctorSpecialty: doctor.specialty,
                patientName: "Paciente (Visualização)", // TODO: Connect to real patient context
                issueDate: new Date(),
                validUntil: new Date(Date.now() + parseInt(prescriptionValidity) * 24 * 60 * 60 * 1000),
                medications: acuteItems.map(item => ({
                    name: item.name,
                    dosage: item.dosage,
                    frequency: item.frequency,
                    notes: item.notes
                })),
                observations: prescriptionObservations
            });

            toast({ title: "Sucesso", description: "Prescrição gerada!" });

        } catch (error) {
            console.error(error);
            toast({ title: "Erro", description: "Não foi possível gerar o PDF.", variant: "destructive" });
        }
    };

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">Vita Prescrições</h1>
                <p className="text-gray-500">Gestão centralizada de medicamentos e alergias.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Left Column: Management */}
                <div className="space-y-8">

                    {/* Allergies */}
                    <Card className="border-red-100 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <div className="space-y-1">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <AlertTriangle className="h-5 w-5 text-red-600" />
                                    Alergias e Reações
                                </CardTitle>
                                <CardDescription>Histórico de sensibilidades</CardDescription>
                            </div>
                            <Button size="sm" variant="outline" onClick={() => setIsAllergyDialogOpen(true)} className="gap-1 text-red-600 border-red-200 hover:bg-red-50">
                                <PlusCircle className="h-4 w-4" /> Registrar
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {allergiesLoading ? (
                                <div className="text-center py-4 text-gray-400">Carregando...</div>
                            ) : allergies.length > 0 ? (
                                <div className="space-y-3">
                                    {allergies.map((alg) => (
                                        <div key={alg.id} className="flex items-start justify-between p-3 bg-red-50/50 rounded-lg border border-red-100">
                                            <div>
                                                <h4 className="font-semibold text-gray-900">{alg.allergen}</h4>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Badge variant="outline" className="bg-white border-red-200 text-red-700 text-[10px]">{alg.severity || "Não especificado"}</Badge>
                                                    <span className="text-xs text-gray-600">{alg.reaction}</span>
                                                </div>
                                            </div>
                                            <div className="flex gap-1">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-700" onClick={() => handleEditAllergy(alg)}>
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-700" onClick={() => deleteAllergyMutation.mutate(alg.id)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500 text-center py-6">Nenhuma alergia registrada.</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Active Medications */}
                    <Card className="border-indigo-100 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <div className="space-y-1">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Pill className="h-5 w-5 text-indigo-600" />
                                    Medicamentos em Uso
                                </CardTitle>
                                <CardDescription>Uso contínuo e ativos</CardDescription>
                            </div>
                            <div className="flex gap-2">
                                <Button size="sm" variant="outline" onClick={() => setIsPrescriptionDialogOpen(true)} className="gap-1 text-indigo-600 border-indigo-200 hover:bg-indigo-50">
                                    <RotateCcw className="h-4 w-4" /> Renovar Receita
                                </Button>
                                <Button size="sm" onClick={() => setIsMedicationDialogOpen(true)} className="gap-1">
                                    <PlusCircle className="h-4 w-4" /> Adicionar
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {medicationsLoading ? (
                                <div className="text-center py-4 text-gray-400">Carregando...</div>
                            ) : medications.length > 0 ? (
                                <div className="space-y-3">
                                    {medications.map((med) => (
                                        <div key={med.id} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 hover:border-indigo-100 transition-colors">
                                            <div>
                                                <h4 className="font-semibold text-gray-900">{med.name}</h4>
                                                <p className="text-sm text-gray-600">{med.dosage} • {med.frequency}</p>
                                                {med.notes && <p className="text-xs text-gray-500 mt-1 italic">{med.notes}</p>}
                                            </div>
                                            <div className="flex gap-1">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-indigo-600" onClick={() => handleEditMedication(med)}>
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-600" onClick={() => deleteMedicationMutation.mutate(med.id)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500 text-center py-6">Nenhum medicamento ativo cadastrado.</p>
                            )}
                        </CardContent>
                    </Card>

                </div>

                {/* Right Column: Acute Prescription */}
                <div className="space-y-6">
                    <Card className="h-full border-green-100 shadow-md bg-gradient-to-b from-white to-green-50/20">
                        <CardHeader className="bg-green-50/50 border-b border-green-100 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-100 rounded-lg text-green-700">
                                    <Stethoscope className="h-6 w-6" />
                                </div>
                                <div>
                                    <CardTitle className="text-xl text-gray-900">Nova Prescrição</CardTitle>
                                    <CardDescription>Gere receitas para medicamentos agudos/novos</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-6">

                            {/* Add Item Form */}
                            <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm space-y-4">
                                <h3 className="font-medium text-gray-700 flex items-center gap-2">
                                    <PlusCircle className="h-4 w-4" /> Adicionar Item
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-gray-500">Medicamento</label>
                                        <Input
                                            placeholder="Ex: Amoxicilina 875mg"
                                            value={currentAcuteItem.name || ""}
                                            onChange={e => setCurrentAcuteItem({ ...currentAcuteItem, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-gray-500">Posologia/Frequência</label>
                                        <Input
                                            placeholder="Ex: 1 cp a cada 12h por 7 dias"
                                            value={currentAcuteItem.frequency || ""}
                                            onChange={e => setCurrentAcuteItem({ ...currentAcuteItem, frequency: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-gray-500">Dose/Conc.</label>
                                        <Input
                                            placeholder="Ex: 875mg"
                                            value={currentAcuteItem.dosage || ""}
                                            onChange={e => setCurrentAcuteItem({ ...currentAcuteItem, dosage: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-gray-500">Observações</label>
                                        <Input
                                            placeholder="Opcional"
                                            value={currentAcuteItem.notes || ""}
                                            onChange={e => setCurrentAcuteItem({ ...currentAcuteItem, notes: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <Button className="w-full bg-green-600 hover:bg-green-700 text-white" onClick={addAcuteItem}>
                                    Adicionar à Receita
                                </Button>
                            </div>

                            {/* Prescription Items List */}
                            <div className="bg-white rounded-xl border border-gray-200 min-h-[200px] flex flex-col">
                                <div className="p-3 border-b bg-gray-50 flex justify-between items-center rounded-t-xl">
                                    <span className="font-medium text-sm text-gray-700">Itens da Receita ({acuteItems.length})</span>
                                    {acuteItems.length > 0 && <Button variant="ghost" size="sm" className="text-xs text-red-500 h-6" onClick={() => setAcuteItems([])}>Limpar</Button>}
                                </div>
                                <div className="p-2 space-y-2 flex-1">
                                    {acuteItems.length > 0 ? (
                                        acuteItems.map((item, idx) => (
                                            <div key={item.id} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 group">
                                                <div className="flex items-start gap-3">
                                                    <div className="bg-green-100 text-green-700 h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                                                        {idx + 1}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-900">{item.name} <span className="font-normal text-gray-600 text-sm">({item.dosage})</span></p>
                                                        <p className="text-sm text-gray-600">{item.frequency}</p>
                                                        {item.notes && <p className="text-xs text-gray-500 mt-1">{item.notes}</p>}
                                                    </div>
                                                </div>
                                                <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeAcuteItem(item.id)}>
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center text-gray-300 gap-2 min-h-[150px]">
                                            <FileText className="h-8 w-8 opacity-20" />
                                            <p className="text-sm">Nenhum item adicionado</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Footer Actions */}
                            <div className="space-y-4 pt-2">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-gray-500">Médico Responsável</label>
                                        <Select value={selectedDoctorId} onValueChange={setSelectedDoctorId}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {doctors.map((d) => (
                                                    <SelectItem key={d.id} value={d.id.toString()}>{d.name} ({d.crm})</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {doctors.length === 0 && <p className="text-xs text-red-500 cursor-pointer hover:underline" onClick={() => setIsDoctorFormDialogOpen(true)}>Cadastrar Médico</p>}
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-gray-500">Validade (dias)</label>
                                        <Select value={prescriptionValidity} onValueChange={setPrescriptionValidity}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="30">30 dias</SelectItem>
                                                <SelectItem value="60">60 dias</SelectItem>
                                                <SelectItem value="90">90 dias</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <Button
                                    className="w-full h-12 text-lg shadow-lg shadow-green-200 bg-green-600 hover:bg-green-700"
                                    onClick={handleGeneratePrescription}
                                    disabled={acuteItems.length === 0 || !selectedDoctorId}
                                >
                                    <Printer className="h-5 w-5 mr-2" />
                                    Gerar e Imprimir Receita
                                </Button>
                            </div>

                        </CardContent>
                    </Card>
                </div>

            </div>

            {/* Dialogs */}
            <MedicationDialog open={isMedicationDialogOpen} onOpenChange={setIsMedicationDialogOpen} form={medicationForm} onSubmit={(data) => addMedicationMutation.mutate(data)} isPending={addMedicationMutation.isPending} mode="create" />
            <MedicationDialog open={isEditMedicationDialogOpen} onOpenChange={setIsEditMedicationDialogOpen} form={editMedicationForm} onSubmit={(data) => { if (editingMedication) editMedicationMutation.mutate({ id: editingMedication.id, data }); }} isPending={editMedicationMutation.isPending} mode="edit" />

            <AllergyDialog open={isAllergyDialogOpen} onOpenChange={setIsAllergyDialogOpen} form={allergyForm} onSubmit={(data) => addAllergyMutation.mutate(data)} isPending={addAllergyMutation.isPending} mode="create" />
            <AllergyDialog open={isEditAllergyDialogOpen} onOpenChange={setIsEditAllergyDialogOpen} form={editAllergyForm} onSubmit={(data) => { if (editingAllergy) editAllergyMutation.mutate({ id: editingAllergy.id, data }); }} isPending={editAllergyMutation.isPending} mode="edit" />

            <PrescriptionDialog
                open={isPrescriptionDialogOpen}
                onOpenChange={setIsPrescriptionDialogOpen}
                doctors={doctors}
                medications={medications}
                onOpenDoctorForm={() => setIsDoctorFormDialogOpen(true)}
                patientName="Paciente (Visualização)"
            />

            <DoctorDialog open={isDoctorFormDialogOpen} onOpenChange={setIsDoctorFormDialogOpen} form={doctorForm} onSubmit={(data) => createDoctorMutation.mutate(data)} isPending={createDoctorMutation.isPending} />
        </div>
    );
}
