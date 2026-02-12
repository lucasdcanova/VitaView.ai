import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FileSignature, CalendarDays, Printer, Save, Trash2, Loader2, BookTemplate } from "lucide-react";
import { COMMON_CIDS } from "@/constants/certificates";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FeatureGate } from "@/components/ui/feature-gate";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { CertificateTemplate } from "@shared/schema";
import { generateCertificateText, generateCertificatePDF } from "@/lib/certificate-pdf";

interface CertificateFormProps {
    certType: 'afastamento' | 'comparecimento' | 'acompanhamento' | 'aptidao' | 'laudo';
    setCertType: (val: any) => void;
    certDays: string;
    setCertDays: (val: string) => void;
    certStartTime: string;
    setCertStartTime: (val: string) => void;
    certEndTime: string;
    setCertEndTime: (val: string) => void;
    certCid: string;
    setCertCid: (val: string) => void;
    patientDoc: string;
    setPatientDoc: (val: string) => void;
    certCity: string;
    setCertCity: (val: string) => void;
    customCertText: string;
    setCustomCertText: (val: string) => void;
    patientName: string;
    onSave: () => void;
    isPending: boolean;
    isUserLoggedIn: boolean;
}

export function CertificateForm({
    certType, setCertType,
    certDays, setCertDays,
    certStartTime, setCertStartTime,
    certEndTime, setCertEndTime,
    certCid, setCertCid,
    patientDoc, setPatientDoc,
    certCity, setCertCity,
    customCertText, setCustomCertText,
    patientName,
    onSave,
    isPending,
    isUserLoggedIn
}: CertificateFormProps) {
    const [templateName, setTemplateName] = useState("");
    const [isSaveTemplateOpen, setIsSaveTemplateOpen] = useState(false);
    const queryClient = useQueryClient();

    const { data: templates = [], isLoading: isLoadingTemplates } = useQuery<CertificateTemplate[]>({
        queryKey: ['/api/certificate-templates'],
        enabled: isUserLoggedIn
    });

    const createTemplateMutation = useMutation({
        mutationFn: async (data: { title: string, content: any }) => {
            const res = await apiRequest("POST", "/api/certificate-templates", data);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/certificate-templates'] });
            toast({ title: "Modelo salvo com sucesso" });
            setIsSaveTemplateOpen(false);
            setTemplateName("");
        },
        onError: () => {
            toast({ title: "Erro ao salvar modelo", variant: "destructive" });
        }
    });

    const deleteTemplateMutation = useMutation({
        mutationFn: async (id: number) => {
            await apiRequest("DELETE", `/api/certificate-templates/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/certificate-templates'] });
            toast({ title: "Modelo excluído" });
        }
    });

    const handleSaveTemplate = () => {
        if (!templateName.trim()) return;

        // Simplify: Save mainly the text content as that's what the user wants for "Templates" now
        const content = {
            customCertText
        };

        createTemplateMutation.mutate({
            title: templateName,
            content
        });
    };

    const handleLoadTemplate = (templateId: string) => {
        const template = templates.find(t => t.id === parseInt(templateId));
        if (!template || !template.content) return;

        const content = template.content as any;

        // Handle both old full-save format and new text-only format
        if (content.customCertText) {
            setCustomCertText(content.customCertText);
        } else if (typeof content === 'string') {
            // Fallback if some raw string was saved
            setCustomCertText(content);
        }

        // Ideally navigate/scroll to text area or highlight it so user knows it loaded
        toast({ title: "Modelo carregado: " + template.title });
    };

    return (
        <Card className="border-gray-200 shadow-md bg-gradient-to-b from-white to-gray-50/20 h-full">
            <CardHeader className="bg-gray-50 border-b border-gray-200 pb-4">
                <CardTitle className="text-xl text-gray-900 flex items-center gap-2">
                    <FileSignature className="h-5 w-5 text-gray-700" />
                    Emissão de Atestado
                </CardTitle>
                <CardDescription>Geração automática de atestados. Use modelos para agilizar.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">

                {/* Templates Section - Premium Feature */}
                {isUserLoggedIn && (
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                        <FeatureGate feature="templates_certificate">
                            <div className="flex flex-col gap-3">
                                <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                    <BookTemplate className="h-4 w-4" />
                                    Meus Modelos
                                </span>
                                <div className="flex gap-2">
                                    <Select onValueChange={handleLoadTemplate}>
                                        <SelectTrigger className="w-full bg-white">
                                            <SelectValue placeholder="Carregar um modelo..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {isLoadingTemplates ? (
                                                <SelectItem value="loading" disabled>Carregando...</SelectItem>
                                            ) : templates.length === 0 ? (
                                                <SelectItem value="empty" disabled>Nenhum modelo salvo</SelectItem>
                                            ) : (
                                                templates.map(t => (
                                                    <div key={t.id} className="flex justify-between items-center w-full px-2 py-1">
                                                        <SelectItem value={t.id.toString()}>{t.title}</SelectItem>
                                                    </div>
                                                ))
                                            )}
                                        </SelectContent>
                                    </Select>

                                    <Dialog open={isSaveTemplateOpen} onOpenChange={setIsSaveTemplateOpen}>
                                        <DialogTrigger asChild>
                                            <Button variant="outline" className="whitespace-nowrap">
                                                Criar Modelo
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-2xl">
                                            <DialogHeader>
                                                <DialogTitle>Criar Modelo de Atestado</DialogTitle>
                                                <DialogDescription>
                                                    Crie um modelo de texto reutilizável para seus atestados.
                                                </DialogDescription>
                                            </DialogHeader>
                                            <div className="space-y-4 py-4">
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium">Nome do Modelo</label>
                                                    <Input
                                                        placeholder="Ex: Atestado Gripe Padrão"
                                                        value={templateName}
                                                        onChange={e => setTemplateName(e.target.value)}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <div className="flex justify-between items-center">
                                                        <label className="text-sm font-medium">Texto do Modelo</label>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-6 text-xs text-red-500 hover:text-red-700 hover:bg-red-50"
                                                            onClick={() => setCustomCertText("")} // In this context, valid to clear local state if binding to it? 
                                                        // Logic check: The dialog should probably have its own state for specific creation, 
                                                        // OR we bind to the main form text?
                                                        // User asked for "caixa de texto para o cliente escrever".
                                                        // Let's use a local state for the dialog text to not mess with the form unless saved?
                                                        // Or pre-fill with current form text?
                                                        // Pre-filling is helpful.
                                                        >
                                                            Limpar Texto
                                                        </Button>
                                                    </div>
                                                    <Textarea
                                                        className="min-h-[200px] font-mono text-sm"
                                                        placeholder="Escreva aqui o texto do seu modelo..."
                                                        value={customCertText} // usage of main form state allows previewing what you are saving
                                                        onChange={e => setCustomCertText(e.target.value)}
                                                    />
                                                    <p className="text-xs text-gray-500">
                                                        Dica: Use [NOME], [RG], [DATA] se quiser deixar marcadores, mas o sistema preenche automaticamente os dados do cabeçalho. Este texto é o CORPO do atestado.
                                                    </p>
                                                </div>
                                            </div>
                                            <DialogFooter>
                                                <Button variant="outline" onClick={() => setIsSaveTemplateOpen(false)}>Cancelar</Button>
                                                <Button onClick={handleSaveTemplate} disabled={createTemplateMutation.isPending || !templateName.trim() || !customCertText.trim()}>
                                                    {createTemplateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                    Salvar Modelo
                                                </Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                </div>

                                {/* List deletion options if needed, or simple dropdown above is enough for loading. 
                                    For deletion, we might need a manage list or small buttons in dropdown if select allows.
                                    Standard select doesn't easily allow buttons inside items. 
                                    Let's add a small list of templates below if any exist to allow deletion. 
                                */}
                                {templates.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {templates.map(t => (
                                            <div key={t.id} className="bg-white border rounded-md px-3 py-1 text-xs flex items-center gap-2 group">
                                                <span className="cursor-pointer" onClick={() => handleLoadTemplate(t.id.toString())}>{t.title}</span>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); deleteTemplateMutation.mutate(t.id); }}
                                                    className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    title="Excluir modelo"
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </FeatureGate>
                    </div>
                )}


                <div className="grid grid-cols-1 gap-6">
                    {/* Settings */}
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700">Tipo de Atestado</label>
                            <Select value={certType} onValueChange={setCertType}>
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
                            <label className="text-sm font-medium text-gray-700">Local</label>
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

                        {/* Generate Button */}
                        <div className="pt-2">
                            <Button
                                className="w-full bg-gray-800 hover:bg-gray-900 text-white shadow-sm"
                                onClick={() => {
                                    const text = generateCertificateText({
                                        type: certType,
                                        doctorName: "",
                                        doctorCrm: "",
                                        patientName: patientName,
                                        patientDoc: patientDoc,
                                        issueDate: new Date(),
                                        daysOff: certDays,
                                        cid: certCid,
                                        city: certCity,
                                        startTime: certStartTime,
                                        endTime: certEndTime
                                    });
                                    setCustomCertText(text);
                                    toast({ title: "Texto gerado com sucesso", description: "Você pode editar o conteúdo abaixo." });
                                }}
                            >
                                <span className="mr-2">✨</span> Gerar Texto do Atestado
                            </Button>
                        </div>

                        {/* Text Editing Section */}
                        <div className="space-y-2 pt-2 border-t border-gray-100">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-gray-700">Conteúdo do Atestado (Editável)</label>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-xs text-red-500 hover:text-red-700 h-6"
                                    onClick={() => setCustomCertText("")}
                                    disabled={!customCertText}
                                >
                                    Limpar
                                </Button>
                            </div>

                            <Textarea
                                className="min-h-[150px] text-sm font-mono bg-white border-gray-300"
                                placeholder="Preencha os dados acima e clique em 'Gerar Texto do Atestado' ou escreva manualmente..."
                                value={customCertText}
                                onChange={e => setCustomCertText(e.target.value)}
                            />
                            {!customCertText && (
                                <p className="text-xs text-gray-500 italic">
                                    O texto final do atestado aparecerá aqui.
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex gap-3 justify-end pt-4">
                    <Button
                        variant="outline"
                        className="h-12 flex-1"
                        onClick={() => {
                            // Quick Preview
                            const data = {
                                type: certType,
                                doctorName: "Dr. Exemplo", // Preview usually needs dummy or current doctor if available
                                doctorCrm: "CRM 123456",
                                patientName: "Nome do Paciente",
                                patientDoc: patientDoc,
                                issueDate: new Date(),
                                daysOff: certDays,
                                cid: certCid,
                                city: certCity,
                                startTime: certStartTime,
                                endTime: certEndTime,
                                customText: customCertText
                            };
                            const blob = generateCertificatePDF(data);
                            const url = URL.createObjectURL(blob);
                            window.open(url, '_blank');
                        }}
                    >
                        <FileSignature className="h-4 w-4 mr-2" />
                        Visualizar
                    </Button>

                    <Button
                        className="h-12 flex-[2] text-base shadow-lg shadow-gray-200 bg-gray-800 hover:bg-gray-900"
                        onClick={onSave}
                        disabled={isPending || !isUserLoggedIn}
                    >
                        <Printer className="h-5 w-5 mr-2" />
                        {isPending ? "Salvando..." : "Salvar e Imprimir"}
                    </Button>
                </div>

            </CardContent >
        </Card >
    );
}
