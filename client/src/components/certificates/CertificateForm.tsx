import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FileSignature, CalendarDays, Printer } from "lucide-react";
import { COMMON_CIDS } from "@/constants/certificates";

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
    onSave,
    isPending,
    isUserLoggedIn
}: CertificateFormProps) {
    return (
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
                        onClick={onSave}
                        disabled={isPending || !isUserLoggedIn}
                    >
                        <Printer className="h-5 w-5 mr-2" />
                        {isPending ? "Salvando..." : "Salvar e Imprimir Atestado"}
                    </Button>
                </div>

            </CardContent>
        </Card>
    );
}
