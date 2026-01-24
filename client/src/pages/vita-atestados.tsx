import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { generateCertificatePDF } from "@/lib/certificate-pdf";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import {
    FileSignature,
    CalendarDays,
    History,
    Printer
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
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
    const [certType, setCertType] = useState<'afastamento' | 'comparecimento' | 'acompanhamento' | 'aptidao' | 'laudo'>("afastamento");
    const [certDays, setCertDays] = useState("1");
    const [certStartTime, setCertStartTime] = useState("");
    const [certEndTime, setCertEndTime] = useState("");
    const [certCid, setCertCid] = useState("");
    const [patientDoc, setPatientDoc] = useState("");
    const [certCity, setCertCity] = useState("São Paulo");
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


            // Print logic moved to handleSaveAndPrintCertificate to manage popup blockers

            toast({ title: "Sucesso", description: "Atestado salvo e gerado!" });
        },
        onError: (err) => {
            console.error(err);
            toast({ title: "Erro", description: "Falha ao salvar atestado.", variant: "destructive" });
        }
    });

    const handleSaveAndPrintCertificate = async () => {
        if (!user) {
            toast({ title: "Erro", description: "Usuário não identificado. Faça login novamente.", variant: "destructive" });
            return;
        }

        const doctorName = user.fullName || user.username || "Dr. VitaView";
        const doctorCrm = user.crm || "CRM pendente";

        // Open tab immediately to avoid blocker
        const newTab = window.open('', '_blank');
        if (newTab) {
            newTab.document.write('<html><body style="display:flex;justify-content:center;align-items:center;height:100vh;font-family:sans-serif;"><div>Salvando e Gerando Atestado...</div></body></html>');
        }

        createCertificateMutation.mutateAsync({
            profileId: patient.id,
            userId: patient.userId,
            doctorName,
            doctorCrm,
            patientName: patient.name,
            patientDoc: patientDoc,
            type: certType,
            issueDate: new Date().toISOString(),
            daysOff: certType === 'afastamento' ? certDays : undefined,
            startTime: certType === 'comparecimento' ? certStartTime : undefined,
            endTime: certType === 'comparecimento' ? certEndTime : undefined,
            cid: certCid || undefined,
            city: certCity,
            customText: customCertText || undefined,
            status: 'active'
        }).then(async (savedData) => {
            // Generate PDF Client-side
            try {
                const blob = generateCertificatePDF({
                    type: savedData.type as any,
                    doctorName: savedData.doctorName,
                    doctorCrm: savedData.doctorCrm,
                    patientName: savedData.patientName,
                    patientDoc: savedData.patientDoc,
                    issueDate: savedData.issueDate,
                    daysOff: savedData.daysOff,
                    startTime: savedData.startTime,
                    endTime: savedData.endTime,
                    cid: savedData.cid,
                    city: savedData.city,
                    customText: savedData.customText
                });

                const url = window.URL.createObjectURL(blob);
                if (newTab) newTab.location.href = url;
            } catch (e) {
                console.error(e);
                newTab?.close();
                toast({ title: "Erro", description: "Atestado salvo, mas falha ao gerar PDF.", variant: "destructive" });
            }
        }).catch(() => {
            newTab?.close();
        });
    };

    const handleReprintCertificate = async (c: Certificate) => {
        const newTab = window.open('', '_blank');
        if (newTab) {
            newTab.document.write('<html><body style="display:flex;justify-content:center;align-items:center;height:100vh;font-family:sans-serif;"><div>Gerando PDF...</div></body></html>');
        }

        try {
            const blob = generateCertificatePDF({
                type: c.type as any,
                doctorName: c.doctorName,
                doctorCrm: c.doctorCrm,
                patientName: c.patientName,
                patientDoc: c.patientDoc || undefined,
                issueDate: c.issueDate,
                daysOff: c.daysOff || undefined,
                startTime: c.startTime || undefined,
                endTime: c.endTime || undefined,
                cid: c.cid || undefined,
                city: c.city || undefined,
                customText: c.customText || undefined
            });

            const url = window.URL.createObjectURL(blob);
            if (newTab) newTab.location.href = url;
            else window.open(url, '_blank');

        } catch (err) {
            console.error("Erro PDF:", err);
            newTab?.close();
            toast({ title: "Erro", description: "Falha ao gerar PDF.", variant: "destructive" });
        }
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                {/* --- COLUNA ESQUERDA: NOVO ATESTADO --- */}
                <div className="space-y-6">
                    <Card className="border-blue-100 shadow-md bg-gradient-to-b from-white to-blue-50/20 h-full">
                        <CardHeader className="bg-blue-50/50 border-b border-blue-100 pb-4">
                            <CardTitle className="text-xl text-gray-900 flex items-center gap-2">
                                <FileSignature className="h-5 w-5 text-blue-700" />
                                Emissão de Atestado
                            </CardTitle>
                            <CardDescription>Geração automática de atestados com CID.</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-6">

                            <div className="grid grid-cols-1 gap-6">
                                {/* Settings */}
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
                                                <SelectItem value="laudo">Laudo Médico</SelectItem>
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
                                        <label className="text-sm font-medium text-gray-700">Cidade (Data)</label>
                                        <Input placeholder="Ex: São Paulo" value={certCity} onChange={e => setCertCity(e.target.value)} />
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

                                    {/* Laudo Médico Text Area */}
                                    {certType === 'laudo' && (
                                        <div className="space-y-1">
                                            <label className="text-sm font-medium text-gray-700">Descrição do Caso / Laudo</label>
                                            <Textarea
                                                className="min-h-[200px] text-sm"
                                                placeholder="Descreva o quadro clínico detalhado..."
                                                value={customCertText}
                                                onChange={e => setCustomCertText(e.target.value)}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-end pt-4">
                                <Button
                                    className="w-full h-12 text-base shadow-lg shadow-blue-200 bg-blue-600 hover:bg-blue-700"
                                    onClick={handleSaveAndPrintCertificate}
                                    disabled={createCertificateMutation.isPending || !user}
                                >
                                    <Printer className="h-5 w-5 mr-2" />
                                    {createCertificateMutation.isPending ? "Salvando..." : "Salvar e Imprimir Atestado"}
                                </Button>
                            </div>

                        </CardContent>
                    </Card>
                </div>

                {/* --- COLUNA DIREITA: HISTÓRICO --- */}
                <div className="space-y-6">
                    <Card className="h-full">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-xl flex items-center gap-2">
                                <History className="h-5 w-5 text-gray-600" />
                                Histórico de Atestados
                            </CardTitle>
                            <CardDescription>Atestados emitidos para este paciente.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                                {certificateHistory.length > 0 ? (
                                    <div className="space-y-3">
                                        {certificateHistory.map(c => (
                                            <div key={c.id} className={`flex flex-col gap-3 p-4 rounded-lg border ${c.status === 'cancelled' ? 'bg-red-50 border-red-100 opacity-70' : 'bg-gray-50 border-gray-100 hover:bg-white hover:shadow-sm transition-all'}`}>
                                                <div className="flex gap-3 items-start">
                                                    <div className="bg-blue-100 p-2 rounded-lg mt-0.5">
                                                        <FileSignature className="h-4 w-4 text-blue-700" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex justify-between items-start">
                                                            <p className="font-semibold text-gray-900 text-sm">Atestado de {c.type.charAt(0).toUpperCase() + c.type.slice(1)}</p>
                                                            <span className="text-xs text-gray-500 bg-white px-2 py-0.5 rounded border border-gray-200">
                                                                {format(new Date(c.issueDate), "dd/MM/yyyy")}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                                            Dr(a). {c.doctorName}
                                                        </p>
                                                        {c.cid && (
                                                            <div className="flex mt-2">
                                                                <span className="text-[10px] font-medium bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">CID: {c.cid}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex justify-end border-t border-gray-100 pt-3 mt-1">
                                                    {c.status === 'active' ? (
                                                        <Button variant="outline" size="sm" className="h-7 text-xs w-full sm:w-auto" onClick={() => handleReprintCertificate(c)}>
                                                            <Printer className="h-3 w-3 mr-1.5" /> Re-Imprimir PDF
                                                        </Button>
                                                    ) : (
                                                        <span className="text-xs text-red-600 font-bold px-2 py-1">CANCELADO</span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <History className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                                        <p className="text-sm text-gray-500 italic">Nenhum atestado emitido ainda.</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
