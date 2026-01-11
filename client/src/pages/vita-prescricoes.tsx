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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    PlusCircle,
    FileText,
    Trash2,
    Stethoscope,
    Printer,
    History,
    Ban
} from "lucide-react";
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

    // Update status (Cancel)
    const updateDocumentStatus = useMutation({
        mutationFn: ({ id, status }: { id: number, status: string }) =>
            apiRequest("PATCH", `/api/prescriptions/${id}/status`, { status }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`/api/prescriptions/patient/${patient.id}`] });
            toast({ title: "Atualizado", description: "Status do documento alterado." });
        }
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

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Vita Prescrições</h1>
                    <p className="text-gray-500">Emissão de receitas médicas para <span className="font-semibold text-primary">{patient.name}</span>.</p>
                </div>

                {/* Professional Info */}
                <div className="w-full md:w-auto min-w-[250px] bg-white px-4 py-2 rounded-lg border border-gray-100 shadow-sm flex flex-col items-end">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-0.5">Médico Prescritor</span>
                    <p className="font-semibold text-gray-900 text-sm">{user?.fullName || user?.username || "Profissional"}</p>
                    {user?.crm && <span className="text-xs text-blue-600 font-medium bg-blue-50 px-1.5 py-0.5 rounded">CRM: {user.crm}</span>}
                </div>
            </div>

            <Tabs defaultValue="prescription" className="w-full">
                <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
                    <TabsTrigger value="prescription" className="gap-2">
                        <Stethoscope className="h-4 w-4" /> Nova Receita
                    </TabsTrigger>
                    <TabsTrigger value="history" className="gap-2">
                        <History className="h-4 w-4" /> Histórico
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
                                    onClick={handleSaveAndPrintPrescription}
                                    disabled={createPrescriptionMutation.isPending || (!isCurrentAcuteItemComplete && acuteItems.length === 0) || !user}
                                >
                                    <Printer className="h-5 w-5 mr-2" />
                                    {createPrescriptionMutation.isPending ? "Salvando..." : "Salvar e Imprimir"}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* --- ABA HISTÓRICO --- */}
                <TabsContent value="history" className="mt-6">
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-xl flex items-center gap-2">
                                    <History className="h-5 w-5 text-gray-600" />
                                    Histórico de Prescrições
                                </CardTitle>
                                <CardDescription>Receitas emitidas para este paciente.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-8">
                                    {/* Receitas Section */}
                                    <div>
                                        {prescriptionHistory.length > 0 ? (
                                            <div className="space-y-2">
                                                {prescriptionHistory.map(p => (
                                                    <div key={p.id} className={`flex items-center justify-between p-3 rounded-lg border ${p.status === 'cancelled' ? 'bg-red-50 border-red-100 opacity-70' : 'bg-white border-gray-100 shadow-sm'}`}>
                                                        <div className="flex gap-4 items-center">
                                                            <div className="bg-green-100 p-2 rounded-full hidden sm:block">
                                                                <FileText className="h-4 w-4 text-green-700" />
                                                            </div>
                                                            <div>
                                                                <p className="font-medium text-gray-900">Receita Médica - {format(new Date(p.issueDate), "dd/MM/yyyy")}</p>
                                                                <p className="text-xs text-gray-500">Dr(a). {p.doctorName} • {(p.medications as any[]).length} med(s)</p>
                                                                {p.status === 'cancelled' && <span className="text-xs text-red-600 font-bold">CANCELADA</span>}
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            {p.status === 'active' && (
                                                                <>
                                                                    <Button variant="outline" size="sm" className="h-8" onClick={() => handleReprintPrescription(p)}>
                                                                        <Printer className="h-3 w-3 mr-1" /> Re-Imprimir
                                                                    </Button>
                                                                    <Button variant="ghost" size="sm" className="h-8 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => {
                                                                        if (confirm("Deseja realmente cancelar/invalidar este documento? A ação será registrada.")) {
                                                                            updateDocumentStatus.mutate({ id: p.id, status: 'cancelled' })
                                                                        }
                                                                    }}>
                                                                        <Ban className="h-3 w-3 mr-1" /> Invalidar
                                                                    </Button>
                                                                </>
                                                            )}
                                                            {p.status === 'cancelled' && (
                                                                <Button disabled variant="outline" size="sm" className="h-8 opacity-50">Cancelado</Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-gray-500 italic">Nenhuma receita encontrada.</p>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>

        </div>
    );
}
