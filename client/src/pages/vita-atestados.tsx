import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { generateCertificatePDF } from "@/lib/prescription-pdf";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    FileSignature,
    CalendarDays,
    History,
    Printer,
    Ban
} from "lucide-react";
import { format } from "date-fns";
import type { Profile, Certificate } from "@shared/schema";

const COMMON_CIDS = [
    { code: "Z00.0", description: "Exame médico geral" },
    { code: "J06.9", description: "Infecção das vias aéreas superiores" },
    { code: "J11", description: "Influenza (gripe)" },
    { code: "A09", description: "Gastroenterite infecciosa" },
    { code: "R51", description: "Cefaleia (dor de cabeça)" },
    { code: "M54.5", description: "Dor lombar baixa" },
    { code: "Z76.3", description: "Pessoa em boa saúde acompanhando doente" },
];

interface VitaCertificatesProps {
    patient: Profile;
}

export default function VitaCertificates({ patient }: VitaCertificatesProps) {
    const { toast } = useToast();
    const { user } = useAuth();
    const queryClient = useQueryClient();

    // --- Certificate State ---
    const [certType, setCertType] = useState<'afastamento' | 'comparecimento' | 'acompanhamento' | 'aptidao'>("afastamento");
    const [certDays, setCertDays] = useState("1");
    const [certStartTime, setCertStartTime] = useState("");
    const [certEndTime, setCertEndTime] = useState("");
    const [certCid, setCertCid] = useState("");
    const [patientDoc, setPatientDoc] = useState("");
    const [customCertText, setCustomCertText] = useState("");

    // Initialize patient doc from profile
    useEffect(() => {
        if (patient?.cpf) {
            setPatientDoc(patient.cpf);
        }
    }, [patient]);

    const { data: certificateHistory = [] } = useQuery<Certificate[]>({
        queryKey: [`/api/certificates/patient/${patient.id}`],
        enabled: !!patient.id
    });

    const createCertificateMutation = useMutation({
        mutationFn: async (data: any) => {
            const res = await apiRequest("POST", "/api/certificates", data);
            return await res.json();
        },
        onSuccess: (savedData) => {
            queryClient.invalidateQueries({ queryKey: [`/api/certificates/patient/${patient.id}`] });

            generateCertificatePDF({
                type: savedData.type as any,
                doctorName: savedData.doctorName,
                doctorCrm: savedData.doctorCrm,
                patientName: savedData.patientName,
                patientDoc: savedData.patientDoc || undefined,
                issueDate: new Date(savedData.issueDate),
                daysOff: savedData.daysOff?.toString(),
                startTime: savedData.startTime || undefined,
                endTime: savedData.endTime || undefined,
                cid: savedData.cid || undefined,
                customText: savedData.customText || undefined
            });

            toast({ title: "Sucesso", description: "Atestado salvo e gerado!" });
        },
        onError: (err) => {
            console.error(err);
            toast({ title: "Erro", description: "Falha ao salvar atestado.", variant: "destructive" });
        }
    });

    // Update status (Cancel)
    const updateDocumentStatus = useMutation({
        mutationFn: ({ id, status }: { id: number, status: string }) =>
            apiRequest("PATCH", `/api/certificates/${id}/status`, { status }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`/api/certificates/patient/${patient.id}`] });
            toast({ title: "Atualizado", description: "Status do documento alterado." });
        }
    });

    const handleSaveAndPrintCertificate = async () => {
        if (!user) {
            toast({ title: "Erro", description: "Usuário não identificado. Faça login novamente.", variant: "destructive" });
            return;
        }

        const doctorName = user.fullName || user.username || "Dr. VitaView";
        const doctorCrm = user.crm || "CRM pendente";

        createCertificateMutation.mutate({
            profileId: patient.id,
            userId: patient.userId,
            doctorName,
            doctorCrm,
            patientName: patient.name,
            patientDoc: patientDoc,
            type: certType,
            issueDate: new Date().toISOString(),
            daysOff: certType === 'afastamento' ? parseInt(certDays) : undefined,
            startTime: certType === 'comparecimento' ? certStartTime : undefined,
            endTime: certType === 'comparecimento' ? certEndTime : undefined,
            cid: certCid || undefined,
            customText: customCertText || undefined,
            status: 'active'
        });
    };

    const handleReprintCertificate = (c: Certificate) => {
        generateCertificatePDF({
            type: c.type as any,
            doctorName: c.doctorName,
            doctorCrm: c.doctorCrm,
            patientName: c.patientName,
            patientDoc: c.patientDoc || undefined,
            issueDate: new Date(c.issueDate),
            daysOff: c.daysOff?.toString(),
            startTime: c.startTime || undefined,
            endTime: c.endTime || undefined,
            cid: c.cid || undefined,
            customText: c.customText || undefined
        });
    };

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Atestados</h1>
                    <p className="text-gray-500">Emissão de atestados médicos para <span className="font-semibold text-primary">{patient.name}</span>.</p>
                </div>

                {/* Professional Info */}
                <div className="w-full md:w-auto min-w-[250px] bg-white px-4 py-2 rounded-lg border border-gray-100 shadow-sm flex flex-col items-end">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-0.5">Médico Prescritor</span>
                    <p className="font-semibold text-gray-900 text-sm">{user?.fullName || user?.username || "Profissional"}</p>
                    {user?.crm && <span className="text-xs text-blue-600 font-medium bg-blue-50 px-1.5 py-0.5 rounded">CRM: {user.crm}</span>}
                </div>
            </div>

            <Tabs defaultValue="new-certificate" className="w-full">
                <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
                    <TabsTrigger value="new-certificate" className="gap-2">
                        <FileSignature className="h-4 w-4" /> Novo Atestado
                    </TabsTrigger>
                    <TabsTrigger value="history" className="gap-2">
                        <History className="h-4 w-4" /> Histórico
                    </TabsTrigger>
                </TabsList>

                {/* --- ABA NOVO ATESTADO --- */}
                <TabsContent value="new-certificate" className="mt-6">
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

                                {/* Right: Preview */}
                                <div className="bg-gray-50 rounded-xl p-4 border border-dashed border-gray-300 flex flex-col justify-center items-center text-center text-gray-500 gap-2">
                                    <FileSignature className="h-10 w-10 opacity-20" />
                                    <p className="text-sm max-w-[200px]">O atestado será gerado automaticamente com base nos dados informados ao lado.</p>
                                    <p className="text-xs text-blue-600 mt-2">Modelo padrão VitaView AI</p>
                                </div>
                            </div>

                            <div className="flex justify-end pt-4">
                                <Button
                                    className="h-12 text-base shadow-lg shadow-blue-200 bg-blue-600 hover:bg-blue-700 min-w-[250px]"
                                    onClick={handleSaveAndPrintCertificate}
                                    disabled={createCertificateMutation.isPending || !user}
                                >
                                    <Printer className="h-5 w-5 mr-2" />
                                    {createCertificateMutation.isPending ? "Salvando..." : "Salvar e Imprimir Atestado"}
                                </Button>
                            </div>

                        </CardContent>
                    </Card>
                </TabsContent>

                {/* --- ABA HISTÓRICO --- */}
                <TabsContent value="history" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-xl flex items-center gap-2">
                                <History className="h-5 w-5 text-gray-600" />
                                Histórico de Atestados
                            </CardTitle>
                            <CardDescription>Atestados emitidos para este paciente.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {certificateHistory.length > 0 ? (
                                    <div className="space-y-2">
                                        {certificateHistory.map(c => (
                                            <div key={c.id} className={`flex items-center justify-between p-3 rounded-lg border ${c.status === 'cancelled' ? 'bg-red-50 border-red-100 opacity-70' : 'bg-white border-gray-100 shadow-sm'}`}>
                                                <div className="flex gap-4 items-center">
                                                    <div className="bg-blue-100 p-2 rounded-full hidden sm:block">
                                                        <FileSignature className="h-4 w-4 text-blue-700" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900">Atestado ({c.type}) - {format(new Date(c.issueDate), "dd/MM/yyyy")}</p>
                                                        <p className="text-xs text-gray-500">Dr(a). {c.doctorName} {c.cid ? `• CID: ${c.cid}` : ''}</p>
                                                        {c.status === 'cancelled' && <span className="text-xs text-red-600 font-bold">CANCELADO</span>}
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    {c.status === 'active' && (
                                                        <>
                                                            <Button variant="outline" size="sm" className="h-8" onClick={() => handleReprintCertificate(c)}>
                                                                <Printer className="h-3 w-3 mr-1" /> Re-Imprimir
                                                            </Button>
                                                            <Button variant="ghost" size="sm" className="h-8 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => {
                                                                if (confirm("Deseja realmente cancelar/invalidar este documento? A ação será registrada.")) {
                                                                    updateDocumentStatus.mutate({ id: c.id, status: 'cancelled' })
                                                                }
                                                            }}>
                                                                <Ban className="h-3 w-3 mr-1" /> Invalidar
                                                            </Button>
                                                        </>
                                                    )}
                                                    {c.status === 'cancelled' && (
                                                        <Button disabled variant="outline" size="sm" className="h-8 opacity-50">Cancelado</Button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500 italic">Nenhum atestado encontrado.</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
