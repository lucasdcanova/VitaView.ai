import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest } from "@/lib/queryClient";
import { generatePrescriptionPDF, generateCertificatePDF } from "@/lib/prescription-pdf";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    PlusCircle,
    FileText,
    Trash2,
    Stethoscope,
    Printer,
    FileSignature,
    Clock,
    CalendarDays
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

const COMMON_CIDS = [
    { code: "Z00.0", description: "Exame médico geral" },
    { code: "J06.9", description: "Infecção das vias aéreas superiores" },
    { code: "J11", description: "Influenza (gripe)" },
    { code: "A09", description: "Gastroenterite infecciosa" },
    { code: "R51", description: "Cefaleia (dor de cabeça)" },
    { code: "M54.5", description: "Dor lombar baixa" },
    { code: "Z76.3", description: "Pessoa em boa saúde acompanhando doente" },
];

export default function VitaPrescriptions() {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const [isDoctorFormDialogOpen, setIsDoctorFormDialogOpen] = useState(false);
    const [selectedDoctorId, setSelectedDoctorId] = useState<string>("");

    // --- Prescription State ---
    const [acuteItems, setAcuteItems] = useState<AcutePrescriptionItem[]>([]);
    const [currentAcuteItem, setCurrentAcuteItem] = useState<Partial<AcutePrescriptionItem>>({});
    const [prescriptionValidity, setPrescriptionValidity] = useState("30");
    const [prescriptionObservations, setPrescriptionObservations] = useState("");

    // --- Certificate State ---
    const [certType, setCertType] = useState<'afastamento' | 'comparecimento' | 'acompanhamento' | 'aptidao'>("afastamento");
    const [certDays, setCertDays] = useState("1");
    const [certStartTime, setCertStartTime] = useState("");
    const [certEndTime, setCertEndTime] = useState("");
    const [certCid, setCertCid] = useState("");
    const [patientDoc, setPatientDoc] = useState("");
    const [customCertText, setCustomCertText] = useState("");

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
            toast({ title: "Gerando Receita...", description: "Preparando documento..." });

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

    const handleGenerateCertificate = async () => {
        if (!selectedDoctorId) {
            toast({ title: "Médico não selecionado", description: "Selecione um médico responsável.", variant: "destructive" });
            return;
        }

        const doctor = doctors.find(d => d.id.toString() === selectedDoctorId);
        if (!doctor) return;

        try {
            toast({ title: "Gerando Atestado...", description: "Preparando documento..." });

            generateCertificatePDF({
                type: certType,
                doctorName: doctor.name,
                doctorCrm: doctor.crm,
                patientName: "Paciente (Visualização)", // TODO: Connect to real patient context
                patientDoc: patientDoc,
                issueDate: new Date(),
                daysOff: certDays,
                startTime: certStartTime,
                endTime: certEndTime,
                cid: certCid,
                customText: customCertText // If logic to preview/edit text
            });

            toast({ title: "Sucesso", description: "Atestado gerado!" });

        } catch (error) {
            console.error(error);
            toast({ title: "Erro", description: "Não foi possível gerar o PDF.", variant: "destructive" });
        }
    };


    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Vita Prescrições</h1>
                    <p className="text-gray-500">Emissão de receitas médicas e atestados.</p>
                </div>

                {/* Global Doctor Selector */}
                <div className="w-full md:w-auto min-w-[250px]">
                    <Select value={selectedDoctorId} onValueChange={setSelectedDoctorId}>
                        <SelectTrigger className="w-full bg-white">
                            <SelectValue placeholder="Selecione o Médico Prescritor" />
                        </SelectTrigger>
                        <SelectContent>
                            {doctors.map((d) => (
                                <SelectItem key={d.id} value={d.id.toString()}>{d.name} ({d.crm})</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {doctors.length === 0 && <p className="text-xs text-red-500 cursor-pointer hover:underline mt-1 text-right" onClick={() => setIsDoctorFormDialogOpen(true)}>+ Cadastrar Médico</p>}
                </div>
            </div>

            <Tabs defaultValue="prescription" className="w-full">
                <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
                    <TabsTrigger value="prescription" className="gap-2">
                        <Stethoscope className="h-4 w-4" /> Receita
                    </TabsTrigger>
                    <TabsTrigger value="certificate" className="gap-2">
                        <FileSignature className="h-4 w-4" /> Atestado
                    </TabsTrigger>
                </TabsList>

                {/* --- ABA RECEITA --- */}
                <TabsContent value="prescription" className="mt-6">
                    <Card className="border-green-100 shadow-md bg-gradient-to-b from-white to-green-50/20">
                        <CardHeader className="bg-green-50/50 border-b border-green-100 pb-4">
                            <CardTitle className="text-xl text-gray-900 flex items-center gap-2">
                                <Stethoscope className="h-5 w-5 text-green-700" />
                                Nova Prescrição
                            </CardTitle>
                            <CardDescription>Adicione medicamentos à receita simples ou controlada.</CardDescription>
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

                            <div className="flex justify-end gap-4 items-end">
                                <div className="space-y-1 w-[200px]">
                                    <label className="text-xs font-medium text-gray-500">Validade da Receita</label>
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
                                <Button
                                    className="h-10 text-base shadow-lg shadow-green-200 bg-green-600 hover:bg-green-700 min-w-[200px]"
                                    onClick={handleGeneratePrescription}
                                    disabled={acuteItems.length === 0 || !selectedDoctorId}
                                >
                                    <Printer className="h-5 w-5 mr-2" />
                                    Imprimir Receita
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* --- ABA ATESTADO --- */}
                <TabsContent value="certificate" className="mt-6">
                    <Card className="border-blue-100 shadow-md bg-gradient-to-b from-white to-blue-50/20">
                        <CardHeader className="bg-blue-50/50 border-b border-blue-100 pb-4">
                            <CardTitle className="text-xl text-gray-900 flex items-center gap-2">
                                <FileSignature className="h-5 w-5 text-blue-700" />
                                Emissão de Atestado
                            </CardTitle>
                            <CardDescription>Geração automática de atestados com CID.</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-6">

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Left: Settings */}
                                <div className="space-y-4">
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-gray-700">Tipo de Atestado</label>
                                        <Select value={certType} onValueChange={(v: any) => setCertType(v)}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="afastamento">Afastamento Médico (Dias)</SelectItem>
                                                <SelectItem value="comparecimento">Comparecimento (Horas)</SelectItem>
                                                <SelectItem value="acompanhamento">Acompanhamento de Paciente</SelectItem>
                                                <SelectItem value="aptidao">Aptidão Física</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Conditional Fields */}
                                    {certType === 'afastamento' && (
                                        <div className="space-y-1">
                                            <label className="text-sm font-medium text-gray-700">Qtd. Dias de Afastamento</label>
                                            <div className="flex items-center gap-2">
                                                <CalendarDays className="text-gray-400 h-4 w-4" />
                                                <Input type="number" min="1" max="90" value={certDays} onChange={e => setCertDays(e.target.value)} />
                                            </div>
                                        </div>
                                    )}

                                    {certType === 'comparecimento' && (
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-sm font-medium text-gray-700">Hora Início</label>
                                                <Input type="time" value={certStartTime} onChange={e => setCertStartTime(e.target.value)} />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-sm font-medium text-gray-700">Hora Fim</label>
                                                <Input type="time" value={certEndTime} onChange={e => setCertEndTime(e.target.value)} />
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-gray-700">RG/CPF do Paciente (Opcional)</label>
                                        <Input placeholder="Para identificação no documento" value={patientDoc} onChange={e => setPatientDoc(e.target.value)} />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-gray-700">CID (Opcional)</label>
                                        <Input
                                            placeholder="Ex: J06.9"
                                            value={certCid}
                                            onChange={e => setCertCid(e.target.value.toUpperCase())}
                                        />
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {COMMON_CIDS.map(cid => (
                                                <Button
                                                    key={cid.code}
                                                    variant="outline"
                                                    size="sm"
                                                    className="text-[10px] h-6 px-2 bg-gray-50"
                                                    onClick={() => setCertCid(cid.code)}
                                                    title={cid.description}
                                                >
                                                    {cid.code}
                                                </Button>
                                            ))}
                                            <Button variant="outline" size="sm" className="text-[10px] h-6 px-2" onClick={() => setCertCid("")}>Limpar</Button>
                                        </div>
                                    </div>
                                </div>

                                {/* Right: Preview is handled by generation logic for simplicity, or we could add live preview text here later */}
                                <div className="bg-gray-50 rounded-xl p-4 border border-dashed border-gray-300 flex flex-col justify-center items-center text-center text-gray-500 gap-2">
                                    <FileSignature className="h-10 w-10 opacity-20" />
                                    <p className="text-sm max-w-[200px]">O atestado será gerado automaticamente com base nos dados informados ao lado.</p>
                                    <p className="text-xs text-blue-600 mt-2">Modelo padrão VitaView AI</p>
                                </div>
                            </div>

                            <div className="flex justify-end pt-4">
                                <Button
                                    className="h-12 text-base shadow-lg shadow-blue-200 bg-blue-600 hover:bg-blue-700 min-w-[250px]"
                                    onClick={handleGenerateCertificate}
                                    disabled={!selectedDoctorId}
                                >
                                    <Printer className="h-5 w-5 mr-2" />
                                    Gerar e Imprimir Atestado
                                </Button>
                            </div>

                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <DoctorDialog open={isDoctorFormDialogOpen} onOpenChange={setIsDoctorFormDialogOpen} form={doctorForm} onSubmit={(data) => createDoctorMutation.mutate(data)} isPending={createDoctorMutation.isPending} />
        </div>
    );
}
