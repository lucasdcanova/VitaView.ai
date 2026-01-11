import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest } from "@/lib/queryClient";
import { generatePrescriptionPDF } from "@/lib/prescription-pdf";
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
    Printer
} from "lucide-react";
import {
    DoctorDialog,
    doctorSchema,
    type DoctorFormData
} from "@/components/dialogs";

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

    const [isDoctorFormDialogOpen, setIsDoctorFormDialogOpen] = useState(false);

    // State for Acute Prescription
    const [acuteItems, setAcuteItems] = useState<AcutePrescriptionItem[]>([]);
    const [currentAcuteItem, setCurrentAcuteItem] = useState<Partial<AcutePrescriptionItem>>({});
    const [selectedDoctorId, setSelectedDoctorId] = useState<string>("");
    const [prescriptionValidity, setPrescriptionValidity] = useState("30");
    const [prescriptionObservations, setPrescriptionObservations] = useState("");

    const { data: doctors = [], isLoading: doctorsLoading } = useQuery<any[]>({
        queryKey: ["/api/doctors"],
    });

    const doctorForm = useForm<DoctorForm>({
        resolver: zodResolver(doctorSchema),
        defaultValues: { name: "", crm: "", specialty: "", isDefault: false },
    });

    // Doctor Mutation
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
                <p className="text-gray-500">Geração de receitas, atestados e prescrições.</p>
            </div>

            <div className="grid grid-cols-1 gap-8">
                {/* Acute Prescription Card - Now Full Width */}
                <Card className="h-full border-green-100 shadow-md bg-gradient-to-b from-white to-green-50/20">
                    <CardHeader className="bg-green-50/50 border-b border-green-100 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 rounded-lg text-green-700">
                                <Stethoscope className="h-6 w-6" />
                            </div>
                            <div>
                                <CardTitle className="text-xl text-gray-900">Nova Prescrição</CardTitle>
                                <CardDescription>Gere receitas para medicamentos</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-6">

                        {/* Add Item Form */}
                        <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm space-y-4">
                            <h3 className="font-medium text-gray-700 flex items-center gap-2">
                                <PlusCircle className="h-4 w-4" /> Adicionar Item
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                <div className="space-y-1 md:col-span-1">
                                    <label className="text-xs font-medium text-gray-500">Medicamento</label>
                                    <Input
                                        placeholder="Ex: Amoxicilina"
                                        value={currentAcuteItem.name || ""}
                                        onChange={e => setCurrentAcuteItem({ ...currentAcuteItem, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1 md:col-span-1">
                                    <label className="text-xs font-medium text-gray-500">Dose/Conc.</label>
                                    <Input
                                        placeholder="Ex: 875mg"
                                        value={currentAcuteItem.dosage || ""}
                                        onChange={e => setCurrentAcuteItem({ ...currentAcuteItem, dosage: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1 md:col-span-1">
                                    <label className="text-xs font-medium text-gray-500">Posologia</label>
                                    <Input
                                        placeholder="Ex: 12/12h por 7 dias"
                                        value={currentAcuteItem.frequency || ""}
                                        onChange={e => setCurrentAcuteItem({ ...currentAcuteItem, frequency: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1 md:col-span-1">
                                    <label className="text-xs font-medium text-gray-500">Obs.</label>
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
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            <DoctorDialog open={isDoctorFormDialogOpen} onOpenChange={setIsDoctorFormDialogOpen} form={doctorForm} onSubmit={(data) => createDoctorMutation.mutate(data)} isPending={createDoctorMutation.isPending} />
        </div>
    );
}
