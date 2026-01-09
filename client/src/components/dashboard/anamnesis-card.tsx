import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, Sparkles } from "lucide-react";

export function AnamnesisCard() {
    const [anamnesisText, setAnamnesisText] = useState("");
    const [extractedRecord, setExtractedRecord] = useState<any>(null);
    const [isApplyingExtraction, setIsApplyingExtraction] = useState(false);
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const handleApplyExtraction = async (recordToApply?: any) => {
        const record = recordToApply || extractedRecord;
        if (!record) return;
        setIsApplyingExtraction(true);
        const today = new Date().toISOString().split("T")[0];
        const created = { diagnoses: 0, medications: 0, allergies: 0 };

        try {
            for (const diagnosis of record.diagnoses || []) {
                if (!diagnosis?.cidCode) continue;
                await apiRequest("POST", "/api/diagnoses", {
                    cidCode: diagnosis.cidCode,
                    diagnosisDate: diagnosis.diagnosisDate || today,
                    status: diagnosis.status || "ativo",
                    notes: diagnosis.notes || diagnosis.description || null,
                });
                created.diagnoses += 1;
            }

            for (const medication of record.medications || []) {
                if (!medication?.name) continue;
                await apiRequest("POST", "/api/medications", {
                    name: medication.name,
                    format: medication.format || "comprimido",
                    dosage: medication.dosage || medication.dose || "dose a confirmar",
                    frequency: medication.frequency || "1x ao dia",
                    notes: medication.notes || null,
                    startDate: medication.startDate || today,
                    isActive: medication.isActive !== false,
                });
                created.medications += 1;
            }

            for (const allergy of record.allergies || []) {
                if (!allergy?.allergen) continue;
                await apiRequest("POST", "/api/allergies", {
                    allergen: allergy.allergen,
                    allergenType: allergy.allergenType || "medication",
                    reaction: allergy.reaction || null,
                    severity: allergy.severity || null,
                    notes: allergy.notes || null,
                });
                created.allergies += 1;
            }

            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ["/api/diagnoses"] }),
                queryClient.invalidateQueries({ queryKey: ["/api/medications"] }),
                queryClient.invalidateQueries({ queryKey: ["/api/allergies"] }),
            ]);

            toast({
                title: "Prontuário atualizado",
                description: `Dados aplicados: ${created.diagnoses} diagnósticos, ${created.medications} medicamentos, ${created.allergies} alergias.`,
            });
            setExtractedRecord(null);
            setAnamnesisText("");
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
        mutationFn: (data: { text: string; date?: string }) => apiRequest("POST", "/api/evolutions", data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/evolutions"] });
            toast({
                title: "Consulta registrada",
                description: "Histórico salvo com sucesso!",
            });
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
            setExtractedRecord(data);
            toast({
                title: "Anamnese analisada",
                description: "Identificamos diagnósticos, medicamentos e alergias a partir do texto.",
            });
            // Automatically apply extraction
            handleApplyExtraction(data);
            // Refresh evolutions to show the new one
            queryClient.invalidateQueries({ queryKey: ["/api/evolutions"] });
        },
        onError: (error: any) => {
            toast({
                title: "Erro na análise",
                description: error?.message || "Não foi possível interpretar o texto.",
                variant: "destructive",
            });
        },
    });

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
                <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                        <CardTitle className="text-2xl text-gray-900">Anamnese inteligente</CardTitle>
                        <CardDescription>
                            Descreva o quadro clínico e deixe a IA identificar diagnósticos, comorbidades, medicamentos e alergias.
                        </CardDescription>
                    </div>
                    <Badge variant="secondary" className="bg-primary-50 text-primary-700 border-primary-200">Beta</Badge>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Textarea
                        value={anamnesisText}
                        onChange={(event) => setAnamnesisText(event.target.value)}
                        placeholder="Ex.: Paciente em acompanhamento por hipertensão controlada com losartana 50mg, histórico familiar de diabetes, refere alergia a penicilina..."
                        className="min-h-[140px] resize-vertical"
                    />
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
                                addEvolutionMutation.mutate({ text: anamnesisText });
                            }}
                            disabled={addEvolutionMutation.isPending || !anamnesisText.trim()}
                            className="gap-2 bg-green-600 hover:bg-green-700"
                        >
                            {addEvolutionMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Save className="h-4 w-4" />
                            )}
                            Salvar como Consulta
                        </Button>
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
                        <Button type="button" variant="ghost" onClick={handleResetAnamnesis} disabled={!anamnesisText && !extractedRecord}>
                            Limpar texto
                        </Button>
                        <p className="text-sm text-gray-500">
                            A IA sugere registros prontos que você pode aplicar ao prontuário em um clique.
                        </p>
                    </div>
                </CardContent>
            </Card>

            {extractedRecord && (
                <Card className="border-primary-200 bg-white shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-2xl text-gray-900">Insights identificados</CardTitle>
                        <CardDescription>{extractedRecord.summary || "Revisão automática da anamnese"}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {Array.isArray(extractedRecord.comorbidities) && extractedRecord.comorbidities.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {extractedRecord.comorbidities.map((item: string, index: number) => (
                                    <span key={`${item}-${index}`} className="rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700">
                                        {item}
                                    </span>
                                ))}
                            </div>
                        )}
                        <div className="grid gap-4 md:grid-cols-3">
                            <div>
                                <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">Diagnósticos sugeridos</p>
                                {Array.isArray(extractedRecord.diagnoses) && extractedRecord.diagnoses.length > 0 ? (
                                    <div className="space-y-2">
                                        {extractedRecord.diagnoses.map((diagnosis: any, index: number) => (
                                            <div key={`diag-${index}`} className="rounded-lg border border-gray-100 bg-gray-50 p-3 text-sm">
                                                <p className="font-semibold text-gray-900">{diagnosis.cidCode || diagnosis.condition || "Diagnóstico sugerido"}</p>
                                                {diagnosis.notes && <p className="text-xs text-gray-600 mt-1">{diagnosis.notes}</p>}
                                                <Badge className="mt-2 w-fit" variant="secondary">{diagnosis.status || "avaliar"}</Badge>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500">Nenhum diagnóstico identificado.</p>
                                )}
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">Medicamentos em uso</p>
                                {Array.isArray(extractedRecord.medications) && extractedRecord.medications.length > 0 ? (
                                    <div className="space-y-2">
                                        {extractedRecord.medications.map((medication: any, index: number) => (
                                            <div key={`med-${index}`} className="rounded-lg border border-gray-100 bg-gray-50 p-3 text-sm">
                                                <p className="font-semibold text-gray-900">{medication.name}</p>
                                                <p className="text-xs text-gray-600 mt-1">
                                                    {medication.dosage || medication.dose || "dosagem não informada"} · {medication.frequency || "frequência não informada"}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500">Sem medicamentos detectados.</p>
                                )}
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">Alergias</p>
                                {Array.isArray(extractedRecord.allergies) && extractedRecord.allergies.length > 0 ? (
                                    <div className="space-y-2">
                                        {extractedRecord.allergies.map((allergy: any, index: number) => (
                                            <div key={`alg-${index}`} className="rounded-lg border border-gray-100 bg-gray-50 p-3 text-sm">
                                                <p className="font-semibold text-red-700">{allergy.allergen}</p>
                                                {allergy.reaction && <p className="text-xs text-gray-600 mt-1">Reação: {allergy.reaction}</p>}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500">Nenhuma alergia encontrada.</p>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
