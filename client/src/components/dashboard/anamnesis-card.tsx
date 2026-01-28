import { useState, useEffect, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useProfiles } from "@/hooks/use-profiles";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FeatureGate } from '@/components/ui/feature-gate';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Loader2, Save, Sparkles, Mic, PlusCircle, X, FileText, Wand2 } from "lucide-react";
import { ConsultationRecorder } from "@/components/consultation-recorder";

type ExtractedDiagnosis = {
    cidCode?: string;
    status?: string;
    diagnosisDate?: string | null;
    notes?: string | null;
};

type ExtractedMedication = {
    name?: string;
    dosage?: string;
    frequency?: string;
    format?: string;
    startDate?: string | null;
    notes?: string | null;
    isActive?: boolean;
};

type ExtractedAllergy = {
    allergen?: string;
    allergenType?: string;
    reaction?: string;
    severity?: string;
    notes?: string | null;
};

type ExtractedSurgery = {
    procedureName?: string;
    surgeryDate?: string | null;
    hospitalName?: string;
    surgeonName?: string;
    notes?: string | null;
};

type ExtractedRecord = {
    summary?: string;
    diagnoses: ExtractedDiagnosis[];
    medications: ExtractedMedication[];
    allergies: ExtractedAllergy[];
    comorbidities: string[];
    surgeries: ExtractedSurgery[];
};

const normalizeExtractedRecord = (payload: any): ExtractedRecord => ({
    summary: payload?.summary || "",
    diagnoses: Array.isArray(payload?.diagnoses)
        ? payload.diagnoses.map((diagnosis: ExtractedDiagnosis & { condition?: string; description?: string }) => {
            const safeDiagnosis = (diagnosis && typeof diagnosis === "object" ? diagnosis : {}) as ExtractedDiagnosis & {
                condition?: string;
                description?: string;
            };
            return {
                ...safeDiagnosis,
                cidCode: safeDiagnosis.cidCode || safeDiagnosis.condition || "",
                notes: safeDiagnosis.notes || safeDiagnosis.description || "",
            };
        })
        : [],
    medications: Array.isArray(payload?.medications)
        ? payload.medications.map((medication: ExtractedMedication & { dose?: string }) => {
            const safeMedication = (medication && typeof medication === "object" ? medication : {}) as ExtractedMedication & {
                dose?: string;
            };
            return {
                ...safeMedication,
                dosage: safeMedication.dosage || safeMedication.dose || "",
            };
        })
        : [],
    allergies: Array.isArray(payload?.allergies) ? payload.allergies : [],
    comorbidities: Array.isArray(payload?.comorbidities) ? payload.comorbidities : [],
    surgeries: Array.isArray(payload?.surgeries) ? payload.surgeries : [],
});

export function AnamnesisCard() {
    const [anamnesisText, setAnamnesisText] = useState("");
    const [extractedRecord, setExtractedRecord] = useState<ExtractedRecord | null>(null);
    const [isApplyingExtraction, setIsApplyingExtraction] = useState(false);
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const { activeProfile, inServiceAppointmentId, clearPatientInService } = useProfiles();
    const previousProfileIdRef = useRef<number | null>(null);

    // Limpar estado quando o paciente mudar
    useEffect(() => {
        if (activeProfile?.id !== previousProfileIdRef.current) {
            // Paciente mudou - limpar todo o estado da anamnese
            setAnamnesisText("");
            setExtractedRecord(null);
            setIsApplyingExtraction(false);
            previousProfileIdRef.current = activeProfile?.id ?? null;
        }
    }, [activeProfile?.id]);

    const updateDiagnosis = (index: number, updates: Partial<ExtractedDiagnosis>) => {
        setExtractedRecord((prev) => {
            if (!prev) return prev;
            const diagnoses = [...prev.diagnoses];
            diagnoses[index] = { ...diagnoses[index], ...updates };
            return { ...prev, diagnoses };
        });
    };

    const removeDiagnosis = (index: number) => {
        setExtractedRecord((prev) => {
            if (!prev) return prev;
            return { ...prev, diagnoses: prev.diagnoses.filter((_, i) => i !== index) };
        });
    };

    const addDiagnosis = () => {
        setExtractedRecord((prev) => {
            if (!prev) return prev;
            return {
                ...prev,
                diagnoses: [
                    ...prev.diagnoses,
                    { cidCode: "", status: "ativo", diagnosisDate: "", notes: "" }
                ],
            };
        });
    };

    const updateMedication = (index: number, updates: Partial<ExtractedMedication>) => {
        setExtractedRecord((prev) => {
            if (!prev) return prev;
            const medications = [...prev.medications];
            medications[index] = { ...medications[index], ...updates };
            return { ...prev, medications };
        });
    };

    const removeMedication = (index: number) => {
        setExtractedRecord((prev) => {
            if (!prev) return prev;
            return { ...prev, medications: prev.medications.filter((_, i) => i !== index) };
        });
    };

    const addMedication = () => {
        setExtractedRecord((prev) => {
            if (!prev) return prev;
            return {
                ...prev,
                medications: [
                    ...prev.medications,
                    { name: "", dosage: "", frequency: "", format: "", startDate: "", notes: "", isActive: true }
                ],
            };
        });
    };

    const updateAllergy = (index: number, updates: Partial<ExtractedAllergy>) => {
        setExtractedRecord((prev) => {
            if (!prev) return prev;
            const allergies = [...prev.allergies];
            allergies[index] = { ...allergies[index], ...updates };
            return { ...prev, allergies };
        });
    };

    const removeAllergy = (index: number) => {
        setExtractedRecord((prev) => {
            if (!prev) return prev;
            return { ...prev, allergies: prev.allergies.filter((_, i) => i !== index) };
        });
    };

    const addAllergy = () => {
        setExtractedRecord((prev) => {
            if (!prev) return prev;
            return {
                ...prev,
                allergies: [
                    ...prev.allergies,
                    { allergen: "", allergenType: "medication", reaction: "", severity: "", notes: "" }
                ],
            };
        });
    };

    const updateSurgery = (index: number, updates: Partial<ExtractedSurgery>) => {
        setExtractedRecord((prev) => {
            if (!prev) return prev;
            const surgeries = [...prev.surgeries];
            surgeries[index] = { ...surgeries[index], ...updates };
            return { ...prev, surgeries };
        });
    };

    const removeSurgery = (index: number) => {
        setExtractedRecord((prev) => {
            if (!prev) return prev;
            return { ...prev, surgeries: prev.surgeries.filter((_, i) => i !== index) };
        });
    };

    const addSurgery = () => {
        setExtractedRecord((prev) => {
            if (!prev) return prev;
            return {
                ...prev,
                surgeries: [
                    ...prev.surgeries,
                    { procedureName: "", surgeryDate: "", hospitalName: "", surgeonName: "", notes: "" }
                ],
            };
        });
    };

    const updateComorbidity = (index: number, value: string) => {
        setExtractedRecord((prev) => {
            if (!prev) return prev;
            const comorbidities = [...prev.comorbidities];
            comorbidities[index] = value;
            return { ...prev, comorbidities };
        });
    };

    const removeComorbidity = (index: number) => {
        setExtractedRecord((prev) => {
            if (!prev) return prev;
            return { ...prev, comorbidities: prev.comorbidities.filter((_, i) => i !== index) };
        });
    };

    const addComorbidity = () => {
        setExtractedRecord((prev) => {
            if (!prev) return prev;
            return { ...prev, comorbidities: [...prev.comorbidities, ""] };
        });
    };

    // Handler para quando a transcrição da consulta é concluída
    const handleTranscriptionComplete = (result: {
        transcription: string;
        anamnesis: string;
        extractedData: {
            summary: string;
            diagnoses: ExtractedDiagnosis[];
            medications: ExtractedMedication[];
            allergies: ExtractedAllergy[];
            comorbidities: string[];
            surgeries: ExtractedSurgery[];
        };
    }) => {
        // Preencher o textarea com a anamnese formatada
        setAnamnesisText(result.anamnesis);

        // Definir os dados extraídos para exibição
        setExtractedRecord(normalizeExtractedRecord(result.extractedData));

        toast({
            title: "Consulta transcrita com sucesso!",
            description: "A anamnese e os dados clínicos foram preenchidos. Revise antes de salvar.",
        });
    };

    const handleApplyExtraction = async (recordToApply?: ExtractedRecord) => {
        const record = recordToApply || extractedRecord;
        if (!record) return;
        setIsApplyingExtraction(true);
        const today = new Date().toISOString().split("T")[0];
        const created = { diagnoses: 0, medications: 0, allergies: 0, surgeries: 0, comorbidities: 0 };
        const skipped = { diagnoses: 0, medications: 0, allergies: 0, surgeries: 0, comorbidities: 0 };

        const diagnosisCodes = new Set(
            (record.diagnoses || [])
                .map((diagnosis) => diagnosis?.cidCode?.trim())
                .filter((code): code is string => Boolean(code))
        );

        try {
            for (const diagnosis of record.diagnoses || []) {
                const cidCode = diagnosis?.cidCode?.trim();
                if (!cidCode) {
                    skipped.diagnoses += 1;
                    continue;
                }
                await apiRequest("POST", "/api/diagnoses", {
                    cidCode,
                    diagnosisDate: diagnosis.diagnosisDate || today,
                    status: diagnosis.status || "ativo",
                    notes: diagnosis.notes || null,
                });
                created.diagnoses += 1;
            }

            for (const comorbidity of record.comorbidities || []) {
                const comorbidityValue = comorbidity?.trim();
                if (!comorbidityValue) {
                    skipped.comorbidities += 1;
                    continue;
                }
                if (diagnosisCodes.has(comorbidityValue)) continue;
                await apiRequest("POST", "/api/diagnoses", {
                    cidCode: comorbidityValue,
                    diagnosisDate: today,
                    status: "cronico",
                    notes: "Comorbidade identificada pela IA",
                });
                created.comorbidities += 1;
                diagnosisCodes.add(comorbidityValue);
            }

            for (const medication of record.medications || []) {
                const name = medication?.name?.trim();
                if (!name) {
                    skipped.medications += 1;
                    continue;
                }
                await apiRequest("POST", "/api/medications", {
                    name,
                    format: medication.format || "comprimido",
                    dosage: medication.dosage || "dose a confirmar",
                    frequency: medication.frequency || "1x ao dia",
                    notes: medication.notes || null,
                    startDate: medication.startDate || today,
                    isActive: medication.isActive !== false,
                });
                created.medications += 1;
            }

            for (const allergy of record.allergies || []) {
                const allergen = allergy?.allergen?.trim();
                if (!allergen) {
                    skipped.allergies += 1;
                    continue;
                }
                await apiRequest("POST", "/api/allergies", {
                    allergen,
                    allergenType: allergy.allergenType || "medication",
                    reaction: allergy.reaction || null,
                    severity: allergy.severity || null,
                    notes: allergy.notes || null,
                });
                created.allergies += 1;
            }

            for (const surgery of record.surgeries || []) {
                const procedureName = surgery?.procedureName?.trim();
                const surgeryDate = surgery?.surgeryDate?.trim();
                if (!procedureName || !surgeryDate) {
                    skipped.surgeries += 1;
                    continue;
                }
                await apiRequest("POST", "/api/surgeries", {
                    procedureName,
                    surgeryDate,
                    hospitalName: surgery.hospitalName || null,
                    surgeonName: surgery.surgeonName || null,
                    notes: surgery.notes || null,
                });
                created.surgeries += 1;
            }

            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ["/api/diagnoses"] }),
                queryClient.invalidateQueries({ queryKey: ["/api/medications"] }),
                queryClient.invalidateQueries({ queryKey: ["/api/allergies"] }),
                queryClient.invalidateQueries({ queryKey: ["/api/surgeries"] }),
            ]);

            const skippedDetails = [
                skipped.diagnoses ? `${skipped.diagnoses} diagnóstico(s)` : null,
                skipped.comorbidities ? `${skipped.comorbidities} comorbidade(s)` : null,
                skipped.medications ? `${skipped.medications} medicamento(s)` : null,
                skipped.allergies ? `${skipped.allergies} alergia(s)` : null,
                skipped.surgeries ? `${skipped.surgeries} cirurgia(s)` : null,
            ].filter(Boolean);

            toast({
                title: "Prontuário atualizado",
                description: `Dados aplicados: ${created.diagnoses} diagnósticos, ${created.comorbidities} comorbidades, ${created.medications} medicamentos, ${created.allergies} alergias, ${created.surgeries} cirurgias.${skippedDetails.length ? ` Itens incompletos não aplicados: ${skippedDetails.join(", ")}.` : ""}`,
            });
            setExtractedRecord(null);
        } catch (error: any) {
            toast({
                title: "Falha ao salvar dados",
                description: error?.message || "Revise o texto ou tente novamente.",
                variant: "destructive",
            });
        } finally {
            setIsApplyingExtraction(false);
        }
    };

    const addEvolutionMutation = useMutation({
        mutationFn: (data: { text: string; date?: string; profileId: number }) => apiRequest("POST", "/api/evolutions", data),
        onSuccess: async () => {
            // Invalidar queries de evoluções para o perfil ativo
            queryClient.invalidateQueries({ queryKey: [`/api/evolutions?profileId=${activeProfile?.id}`] });

            // Se houver um agendamento em atendimento, marcar como concluído
            if (inServiceAppointmentId) {
                try {
                    await apiRequest("PATCH", `/api/appointments/${inServiceAppointmentId}`, { status: 'completed' });
                    queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
                    clearPatientInService();
                    toast({
                        title: "Consulta finalizada",
                        description: "Atendimento concluído e registrado na agenda!",
                    });
                } catch (err) {
                    console.error("Erro ao atualizar status do agendamento:", err);
                    toast({
                        title: "Consulta registrada",
                        description: "Histórico salvo, mas houve erro ao atualizar a agenda.",
                    });
                }
            } else {
                toast({
                    title: "Consulta registrada",
                    description: "Histórico salvo com sucesso!",
                });
            }
            setAnamnesisText("");
        },
        onError: () => {
            toast({
                title: "Erro",
                description: "Erro ao salvar consulta. Tente novamente.",
                variant: "destructive",
            });
        },
    });

    const analyzeAnamnesisMutation = useMutation({
        mutationFn: async ({ text }: { text: string }) => {
            const res = await apiRequest("POST", "/api/patient-record/analyze", { text });
            return await res.json();
        },
        onSuccess: (data) => {
            setExtractedRecord(normalizeExtractedRecord(data));
            toast({
                title: "Anamnese analisada",
                description: "Identificamos dados clínicos. Revise antes de aplicar ao prontuário.",
            });
            queryClient.invalidateQueries({ queryKey: [`/api/evolutions?profileId=${activeProfile?.id}`] });
        },
        onError: (error: any) => {
            toast({
                title: "Erro na análise",
                description: error?.message || "Não foi possível interpretar o texto.",
                variant: "destructive",
            });
        },
    });

    const enhanceAnamnesisMutation = useMutation({
        mutationFn: async ({ text }: { text: string }) => {
            const res = await apiRequest("POST", "/api/patient-record/enhance", { text });
            return await res.json();
        },
        onSuccess: (data) => {
            setAnamnesisText(data.text);
            toast({
                title: "Anamnese melhorada",
                description: "O texto foi reescrito e formatado pela IA.",
            });
        },
        onError: (error: any) => {
            toast({
                title: "Erro ao melhorar texto",
                description: error?.message || "Não foi possível melhorar o texto.",
                variant: "destructive",
            });
        },
    });

    const handleEnhanceAnamnesis = () => {
        if (!anamnesisText.trim()) {
            toast({
                title: "Texto vazio",
                description: "Escreva algo para a IA melhorar.",
                variant: "destructive",
            });
            return;
        }
        enhanceAnamnesisMutation.mutate({ text: anamnesisText });
    };

    const handleAnalyzeAnamnesis = () => {
        if (!anamnesisText.trim()) {
            toast({
                title: "Anamnese vazia",
                description: "Descreva o quadro clínico antes de solicitar a análise.",
                variant: "destructive",
            });
            return;
        }
        analyzeAnamnesisMutation.mutate({ text: anamnesisText.trim() });
    };

    const handleResetAnamnesis = () => {
        setAnamnesisText("");
        setExtractedRecord(null);
    };

    return (
        <div className="space-y-8">
            <Card className="border border-primary-100 shadow-md">
                <CardHeader className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <div>
                            <div className="flex items-center gap-2">
                                <CardTitle className="text-2xl text-gray-900">Anamnese inteligente</CardTitle>
                                <Badge variant="secondary" className="bg-primary-50 text-primary-700 border-primary-200">Beta</Badge>
                            </div>
                            <CardDescription>
                                Grave a consulta ou descreva o quadro clínico. A IA identifica diagnósticos, medicamentos e alergias.
                            </CardDescription>
                        </div>
                    </div>

                    {/* Destaque para gravação de consulta */}
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-red-50 to-orange-50 rounded-lg border border-red-100">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-100 rounded-full">
                                <Mic className="h-5 w-5 text-red-600" />
                            </div>
                            <div>
                                <p className="font-semibold text-gray-900">Transcrição automática</p>
                                <p className="text-sm text-gray-600">Grave a consulta e a IA preenche a anamnese automaticamente</p>
                            </div>
                        </div>
                        <FeatureGate feature="ai-recording">
                            <ConsultationRecorder
                                onTranscriptionComplete={handleTranscriptionComplete}
                                profileId={activeProfile?.id}
                            />
                        </FeatureGate>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Textarea
                        value={anamnesisText}
                        onChange={(event) => setAnamnesisText(event.target.value)}
                        placeholder="Ex.: Paciente em acompanhamento por hipertensão controlada com losartana 50mg, histórico familiar de diabetes, refere alergia a penicilina..."
                        className="min-h-[140px] resize-vertical"
                    />
                    {anamnesisText && (
                        <div className="p-3 bg-gray-50 rounded-md border border-gray-100 text-sm">
                            <div className="flex items-center gap-1.5 mb-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                                <FileText className="h-3.5 w-3.5" />
                                Como será visualizado
                            </div>
                            <div className="whitespace-pre-line text-gray-700 leading-relaxed">
                                {/* Helper para formatar texto com negrito (**texto**) */}
                                {(() => {
                                    const formatBoldText = (text: string | null | undefined) => {
                                        if (!text) return null;
                                        const parts = text.split(/(\*\*.*?\*\*)/g);
                                        return (
                                            <span>
                                                {parts.map((part, index) => {
                                                    if (part.startsWith('**') && part.endsWith('**')) {
                                                        return <strong key={index} className="font-bold text-gray-900">{part.slice(2, -2)}</strong>;
                                                    }
                                                    return part;
                                                })}
                                            </span>
                                        );
                                    };
                                    return formatBoldText(anamnesisText);
                                })()}
                            </div>
                        </div>
                    )}
                    <div className="flex flex-wrap items-center gap-3">
                        <Button
                            type="button"
                            onClick={() => {
                                if (!anamnesisText.trim()) {
                                    toast({
                                        title: "Texto vazio",
                                        description: "Escreva algo para salvar.",
                                        variant: "destructive"
                                    });
                                    return;
                                }
                                if (!activeProfile?.id) {
                                    toast({
                                        title: "Nenhum paciente selecionado",
                                        description: "Selecione um paciente antes de salvar a evolução.",
                                        variant: "destructive"
                                    });
                                    return;
                                }
                                addEvolutionMutation.mutate({ text: anamnesisText, profileId: activeProfile.id });
                            }}
                            disabled={addEvolutionMutation.isPending || !anamnesisText.trim() || !activeProfile?.id}
                            className="gap-2 bg-green-600 hover:bg-green-700"
                        >
                            {addEvolutionMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Save className="h-4 w-4" />
                            )}
                            Salvar como Consulta
                        </Button>
                        <FeatureGate feature="ai-enhance">
                            <Button
                                type="button"
                                onClick={handleEnhanceAnamnesis}
                                disabled={enhanceAnamnesisMutation.isPending || !anamnesisText.trim()}
                                variant="secondary"
                                className="gap-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200"
                            >
                                {enhanceAnamnesisMutation.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Wand2 className="h-4 w-4" />
                                )}
                                Melhorar com IA
                            </Button>
                        </FeatureGate>
                        <FeatureGate feature="ai-analyze">
                            <Button
                                type="button"
                                onClick={handleAnalyzeAnamnesis}
                                disabled={analyzeAnamnesisMutation.isPending}
                                className="gap-2"
                            >
                                {analyzeAnamnesisMutation.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Sparkles className="h-4 w-4" />
                                )}
                                Extrair dados com IA
                            </Button>
                        </FeatureGate>
                        <Button type="button" variant="ghost" onClick={handleResetAnamnesis} disabled={!anamnesisText && !extractedRecord}>
                            Limpar texto
                        </Button>
                        <p className="text-sm text-gray-500">
                            A IA sugere registros prontos para revisão antes de aplicar ao prontuário.
                        </p>
                    </div>
                </CardContent>
            </Card>

            {extractedRecord && (
                <Card className="border-primary-200 bg-white shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-2xl text-gray-900">Revisão dos dados extraídos</CardTitle>
                        <CardDescription>
                            {extractedRecord.summary || "Revise, ajuste e aplique ao prontuário quando estiver pronto."}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <p className="text-xs uppercase tracking-wide text-gray-500">Comorbidades</p>
                                    <Button type="button" variant="outline" size="sm" className="gap-1" onClick={addComorbidity}>
                                        <PlusCircle className="h-4 w-4" />
                                        Adicionar
                                    </Button>
                                </div>
                                {extractedRecord.comorbidities.length > 0 ? (
                                    <div className="space-y-2">
                                        {extractedRecord.comorbidities.map((item, index) => (
                                            <div key={`comorb-${index}`} className="flex items-center gap-2">
                                                <Input
                                                    value={item}
                                                    onChange={(event) => updateComorbidity(index, event.target.value)}
                                                    placeholder="Ex: Hipertensão arterial"
                                                />
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => removeComorbidity(index)}
                                                    className="text-gray-400 hover:text-red-600"
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500">Nenhuma comorbidade identificada.</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <p className="text-xs uppercase tracking-wide text-gray-500">Diagnósticos sugeridos</p>
                                    <Button type="button" variant="outline" size="sm" className="gap-1" onClick={addDiagnosis}>
                                        <PlusCircle className="h-4 w-4" />
                                        Adicionar
                                    </Button>
                                </div>
                                {extractedRecord.diagnoses.length > 0 ? (
                                    <div className="space-y-3">
                                        {extractedRecord.diagnoses.map((diagnosis, index) => (
                                            <div key={`diag-${index}`} className="rounded-lg border border-gray-100 bg-gray-50 p-3 space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs text-gray-500">Diagnóstico {index + 1}</span>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => removeDiagnosis(index)}
                                                        className="text-gray-400 hover:text-red-600"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                                <div className="grid gap-2 md:grid-cols-2">
                                                    <Input
                                                        value={diagnosis.cidCode ?? ""}
                                                        onChange={(event) => updateDiagnosis(index, { cidCode: event.target.value })}
                                                        placeholder="CID-10"
                                                    />
                                                    <Select
                                                        value={diagnosis.status || ""}
                                                        onValueChange={(value) => updateDiagnosis(index, { status: value })}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Status" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="ativo">Ativo</SelectItem>
                                                            <SelectItem value="cronico">Crônico</SelectItem>
                                                            <SelectItem value="em_tratamento">Em tratamento</SelectItem>
                                                            <SelectItem value="resolvido">Resolvido</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <Input
                                                        type="date"
                                                        value={diagnosis.diagnosisDate ?? ""}
                                                        onChange={(event) => updateDiagnosis(index, { diagnosisDate: event.target.value })}
                                                    />
                                                    <Input
                                                        value={diagnosis.notes ?? ""}
                                                        onChange={(event) => updateDiagnosis(index, { notes: event.target.value })}
                                                        placeholder="Observações"
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500">Nenhum diagnóstico identificado.</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <p className="text-xs uppercase tracking-wide text-gray-500">Medicamentos em uso</p>
                                    <Button type="button" variant="outline" size="sm" className="gap-1" onClick={addMedication}>
                                        <PlusCircle className="h-4 w-4" />
                                        Adicionar
                                    </Button>
                                </div>
                                {extractedRecord.medications.length > 0 ? (
                                    <div className="space-y-3">
                                        {extractedRecord.medications.map((medication, index) => (
                                            <div key={`med-${index}`} className="rounded-lg border border-gray-100 bg-gray-50 p-3 space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs text-gray-500">Medicamento {index + 1}</span>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => removeMedication(index)}
                                                        className="text-gray-400 hover:text-red-600"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                                <div className="grid gap-2 md:grid-cols-2">
                                                    <Input
                                                        value={medication.name ?? ""}
                                                        onChange={(event) => updateMedication(index, { name: event.target.value })}
                                                        placeholder="Medicamento"
                                                    />
                                                    <Input
                                                        value={medication.dosage ?? ""}
                                                        onChange={(event) => updateMedication(index, { dosage: event.target.value })}
                                                        placeholder="Dosagem"
                                                    />
                                                    <Input
                                                        value={medication.frequency ?? ""}
                                                        onChange={(event) => updateMedication(index, { frequency: event.target.value })}
                                                        placeholder="Frequência"
                                                    />
                                                    <Input
                                                        value={medication.format ?? ""}
                                                        onChange={(event) => updateMedication(index, { format: event.target.value })}
                                                        placeholder="Forma farmacêutica"
                                                    />
                                                    <Input
                                                        type="date"
                                                        value={medication.startDate ?? ""}
                                                        onChange={(event) => updateMedication(index, { startDate: event.target.value })}
                                                    />
                                                    <Input
                                                        value={medication.notes ?? ""}
                                                        onChange={(event) => updateMedication(index, { notes: event.target.value })}
                                                        placeholder="Observações"
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500">Sem medicamentos detectados.</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <p className="text-xs uppercase tracking-wide text-gray-500">Alergias</p>
                                    <Button type="button" variant="outline" size="sm" className="gap-1" onClick={addAllergy}>
                                        <PlusCircle className="h-4 w-4" />
                                        Adicionar
                                    </Button>
                                </div>
                                {extractedRecord.allergies.length > 0 ? (
                                    <div className="space-y-3">
                                        {extractedRecord.allergies.map((allergy, index) => (
                                            <div key={`alg-${index}`} className="rounded-lg border border-gray-100 bg-gray-50 p-3 space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs text-gray-500">Alergia {index + 1}</span>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => removeAllergy(index)}
                                                        className="text-gray-400 hover:text-red-600"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                                <div className="grid gap-2 md:grid-cols-2">
                                                    <Input
                                                        value={allergy.allergen ?? ""}
                                                        onChange={(event) => updateAllergy(index, { allergen: event.target.value })}
                                                        placeholder="Alérgeno"
                                                    />
                                                    <Input
                                                        value={allergy.reaction ?? ""}
                                                        onChange={(event) => updateAllergy(index, { reaction: event.target.value })}
                                                        placeholder="Reação"
                                                    />
                                                    <Select
                                                        value={allergy.severity || ""}
                                                        onValueChange={(value) => updateAllergy(index, { severity: value })}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Severidade" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="leve">Leve</SelectItem>
                                                            <SelectItem value="moderada">Moderada</SelectItem>
                                                            <SelectItem value="grave">Grave</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <Select
                                                        value={allergy.allergenType || ""}
                                                        onValueChange={(value) => updateAllergy(index, { allergenType: value })}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Tipo de alérgeno" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="medication">Medicamento</SelectItem>
                                                            <SelectItem value="food">Alimento</SelectItem>
                                                            <SelectItem value="environmental">Ambiental</SelectItem>
                                                            <SelectItem value="other">Outro</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <Input
                                                        value={allergy.notes ?? ""}
                                                        onChange={(event) => updateAllergy(index, { notes: event.target.value })}
                                                        placeholder="Observações"
                                                        className="md:col-span-2"
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500">Nenhuma alergia encontrada.</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <p className="text-xs uppercase tracking-wide text-gray-500">Cirurgias prévias</p>
                                    <Button type="button" variant="outline" size="sm" className="gap-1" onClick={addSurgery}>
                                        <PlusCircle className="h-4 w-4" />
                                        Adicionar
                                    </Button>
                                </div>
                                {extractedRecord.surgeries.length > 0 ? (
                                    <div className="space-y-3">
                                        {extractedRecord.surgeries.map((surgery, index) => (
                                            <div key={`surgery-${index}`} className="rounded-lg border border-gray-100 bg-gray-50 p-3 space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs text-gray-500">Cirurgia {index + 1}</span>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => removeSurgery(index)}
                                                        className="text-gray-400 hover:text-red-600"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                                <div className="grid gap-2 md:grid-cols-2">
                                                    <Input
                                                        value={surgery.procedureName ?? ""}
                                                        onChange={(event) => updateSurgery(index, { procedureName: event.target.value })}
                                                        placeholder="Procedimento"
                                                    />
                                                    <Input
                                                        type="date"
                                                        value={surgery.surgeryDate ?? ""}
                                                        onChange={(event) => updateSurgery(index, { surgeryDate: event.target.value })}
                                                    />
                                                    <Input
                                                        value={surgery.hospitalName ?? ""}
                                                        onChange={(event) => updateSurgery(index, { hospitalName: event.target.value })}
                                                        placeholder="Hospital"
                                                    />
                                                    <Input
                                                        value={surgery.surgeonName ?? ""}
                                                        onChange={(event) => updateSurgery(index, { surgeonName: event.target.value })}
                                                        placeholder="Cirurgião"
                                                    />
                                                    <Input
                                                        value={surgery.notes ?? ""}
                                                        onChange={(event) => updateSurgery(index, { notes: event.target.value })}
                                                        placeholder="Observações"
                                                        className="md:col-span-2"
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500">Nenhuma cirurgia identificada.</p>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <Button
                                type="button"
                                onClick={() => handleApplyExtraction()}
                                disabled={isApplyingExtraction}
                                className="gap-2"
                            >
                                {isApplyingExtraction ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Save className="h-4 w-4" />
                                )}
                                Aplicar ao prontuário
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setExtractedRecord(null)}
                                disabled={isApplyingExtraction}
                            >
                                Descartar sugestões
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
