import {
  useState,
  useEffect,
  useRef,
  type ClipboardEvent } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useMutation,
  useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useProfiles } from "@/hooks/use-profiles";
import { Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FeatureGate } from '@/components/ui/feature-gate';
import { Input } from "@/components/ui/input";
import {
    Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  } from "@/components/ui/select";
import { Save,
  Sparkles,
  Mic,
  PlusCircle,
  X,
  Wand2,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  RemoveFormatting,
  Undo2,
  Redo2,
} from "lucide-react";
import { ConsultationRecorder } from "@/components/consultation-recorder";
import { BrandLoader } from "@/components/ui/brand-loader";
import { useConsultationRecording } from "@/hooks/use-consultation-recording";
import { useAuth } from "@/hooks/use-auth";
import { ExamUploadLauncher } from "@/components/exams/exam-upload-launcher";
import { normalizeClinicalContent, stripClinicalHtml } from "@shared/clinical-rich-text";

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

type ApplyExtractionCounters = {
    diagnoses: number;
    medications: number;
    allergies: number;
    surgeries: number;
    comorbidities: number;
};

type ApplyExtractionResult = {
    created: ApplyExtractionCounters;
    skipped: ApplyExtractionCounters;
    failed: ApplyExtractionCounters;
    remainingRecord: ExtractedRecord;
};

type AnamnesisDraft = {
    text: string;
    extractedRecord: ExtractedRecord | null;
};

const getAnamnesisDraftStorageKey = (profileId: number, userId?: number | null) =>
    `anamnese-rascunho-${userId ?? "anon"}-${profileId}`;

const readAnamnesisDraft = (profileId: number, userId?: number | null): AnamnesisDraft | null => {
    if (typeof window === "undefined") return null;

    try {
        const raw = window.localStorage.getItem(getAnamnesisDraftStorageKey(profileId, userId));
        if (!raw) return null;

        const parsed = JSON.parse(raw);
        return {
            text: typeof parsed?.text === "string" ? parsed.text : "",
            extractedRecord: parsed?.extractedRecord ? normalizeExtractedRecord(parsed.extractedRecord) : null,
        };
    } catch {
        return null;
    }
};

const writeAnamnesisDraft = (profileId: number, draft: AnamnesisDraft, userId?: number | null) => {
    if (typeof window === "undefined") return;

    const hasText = Boolean(stripClinicalHtml(draft.text).trim());
    const hasExtractedRecord = Boolean(draft.extractedRecord);
    const storageKey = getAnamnesisDraftStorageKey(profileId, userId);

    if (!hasText && !hasExtractedRecord) {
        window.localStorage.removeItem(storageKey);
        return;
    }

    window.localStorage.setItem(storageKey, JSON.stringify(draft));
};

const clearAnamnesisDraft = (profileId: number, userId?: number | null) => {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(getAnamnesisDraftStorageKey(profileId, userId));
};

const normalizeExtractedRecord = (payload: any): ExtractedRecord => ({
    summary: payload?.summary || "",
    diagnoses: Array.isArray(payload?.diagnoses)
        ? payload.diagnoses.map((diagnosis: ExtractedDiagnosis & { condition?: string; description?: string }) => {
            const safeDiagnosis = (diagnosis && typeof diagnosis === "object" ? diagnosis : { }) as ExtractedDiagnosis & {
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
            const safeMedication = (medication && typeof medication === "object" ? medication : { }) as ExtractedMedication & {
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

const createApplyExtractionCounters = (): ApplyExtractionCounters => ({
    diagnoses: 0,
    medications: 0,
    allergies: 0,
    surgeries: 0,
    comorbidities: 0,
});

const countAppliedItems = (counters: ApplyExtractionCounters) =>
    Object.values(counters).reduce((total, value) => total + value, 0);

const formatApplyExtractionDetails = (counters: ApplyExtractionCounters) =>
    [
        counters.diagnoses ? `${counters.diagnoses} diagnóstico(s)` : null,
        counters.comorbidities ? `${counters.comorbidities} comorbidade(s)` : null,
        counters.medications ? `${counters.medications} medicamento(s)` : null,
        counters.allergies ? `${counters.allergies} alergia(s)` : null,
        counters.surgeries ? `${counters.surgeries} cirurgia(s)` : null,
    ].filter(Boolean);

const hasPendingExtractedItems = (record: ExtractedRecord | null | undefined) =>
    Boolean(
        record &&
        (
            record.diagnoses.length > 0 ||
            record.medications.length > 0 ||
            record.allergies.length > 0 ||
            record.comorbidities.length > 0 ||
            record.surgeries.length > 0
        )
    );

export function AnamnesisCard() {
    const isMobile = useIsMobile();
    const [anamnesisText, setAnamnesisText] = useState("");
    const [extractedRecord, setExtractedRecord] = useState<ExtractedRecord | null>(null);
    const [isApplyingExtraction, setIsApplyingExtraction] = useState(false);
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const { activeProfile, inServiceAppointmentId, clearPatientInService } = useProfiles();
    const { completedResult, clearCompletedResult } = useConsultationRecording();
    const { user } = useAuth();
    const previousDraftKeyRef = useRef<string | null>(null);
    const hydratedDraftKeyRef = useRef<string | null>(null);
    const editorRef = useRef<HTMLDivElement | null>(null);
    const isUpdatingFromEditorRef = useRef(false);
    const anamnesisPlainText = stripClinicalHtml(anamnesisText).trim();

    // Restaurar rascunho quando o paciente mudar ou quando o componente montar novamente
    useEffect(() => {
        const profileId = activeProfile?.id ?? null;
        const draftKey = profileId ? getAnamnesisDraftStorageKey(profileId, user?.id) : null;

        if (draftKey === previousDraftKeyRef.current) return;

        previousDraftKeyRef.current = draftKey;
        hydratedDraftKeyRef.current = draftKey;
        setIsApplyingExtraction(false);

        if (!profileId) {
            setAnamnesisText("");
            setExtractedRecord(null);
            return;
        }

        let draft = readAnamnesisDraft(profileId, user?.id);

        // Migra rascunho salvo antes da autenticação terminar de carregar.
        if (!draft && user?.id) {
            draft = readAnamnesisDraft(profileId, null);
            if (draft) {
                writeAnamnesisDraft(profileId, draft, user.id);
                clearAnamnesisDraft(profileId, null);
            }
        }

        setAnamnesisText(normalizeClinicalContent(draft?.text ?? ""));
        setExtractedRecord(draft?.extractedRecord ?? null);
    }, [activeProfile?.id, user?.id]);

    // Persistir rascunho para sobreviver à troca de abas e páginas
    useEffect(() => {
        const profileId = activeProfile?.id;
        const draftKey = profileId ? getAnamnesisDraftStorageKey(profileId, user?.id) : null;
        if (!profileId) return;
        if (hydratedDraftKeyRef.current !== draftKey) return;

        writeAnamnesisDraft(
            profileId,
            {
                text: anamnesisText,
                extractedRecord,
            },
            user?.id
        );
    }, [activeProfile?.id, anamnesisText, extractedRecord, user?.id]);

    useEffect(() => {
        if (isUpdatingFromEditorRef.current) {
            isUpdatingFromEditorRef.current = false;
            return;
        }
        if (!editorRef.current) return;
        const normalized = normalizeClinicalContent(anamnesisText);
        if (editorRef.current.innerHTML !== normalized) {
            editorRef.current.innerHTML = normalized;
        }
    }, [anamnesisText]);

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
        const normalizedAnamnesis = normalizeClinicalContent(result.anamnesis);
        setAnamnesisText(normalizedAnamnesis);
        setExtractedRecord(normalizeExtractedRecord(result.extractedData));

        if (normalizedAnamnesis) {
            enhanceAnamnesisMutation.mutate({ text: normalizedAnamnesis, auto: true });
        }

        toast({
            title: "Consulta transcrita com sucesso!",
            description: "A anamnese foi preenchida e enviada automaticamente para refinamento com IA.",
        });
    };

    useEffect(() => {
        if (!completedResult || !activeProfile?.id) return;
        if (completedResult.profileId !== activeProfile.id) return;

        handleTranscriptionComplete({
            transcription: completedResult.transcription,
            anamnesis: completedResult.anamnesis,
            extractedData: completedResult.extractedData,
        });
        clearCompletedResult();
    }, [activeProfile?.id, clearCompletedResult, completedResult]);

    const applyExtractedRecord = async (
        recordToApply: ExtractedRecord,
        options?: { showToast?: boolean }
    ): Promise<ApplyExtractionResult> => {
        if (!activeProfile?.id) {
            throw new Error("Selecione um paciente antes de aplicar os dados extraídos.");
        }

        const profileId = activeProfile.id;
        const today = new Date().toISOString().split("T")[0];
        const created = createApplyExtractionCounters();
        const skipped = createApplyExtractionCounters();
        const failed = createApplyExtractionCounters();
        const remainingRecord: ExtractedRecord = {
            summary: recordToApply.summary || "",
            diagnoses: [],
            medications: [],
            allergies: [],
            comorbidities: [],
            surgeries: [],
        };

        const diagnosisCodes = new Set(
            (recordToApply.diagnoses || [])
                .map((diagnosis) => diagnosis?.cidCode?.trim())
                .filter((code): code is string => Boolean(code))
        );

        for (const diagnosis of recordToApply.diagnoses || []) {
            const cidCode = diagnosis?.cidCode?.trim();
            if (!cidCode) {
                skipped.diagnoses += 1;
                remainingRecord.diagnoses.push(diagnosis);
                continue;
            }

            try {
                await apiRequest("POST", "/api/diagnoses", {
                    profileId,
                    cidCode,
                    diagnosisDate: diagnosis.diagnosisDate || today,
                    status: diagnosis.status || "ativo",
                    notes: diagnosis.notes || null,
                });
                created.diagnoses += 1;
            } catch {
                failed.diagnoses += 1;
                remainingRecord.diagnoses.push(diagnosis);
            }
        }

        for (const comorbidity of recordToApply.comorbidities || []) {
            const comorbidityValue = comorbidity?.trim();
            if (!comorbidityValue) {
                skipped.comorbidities += 1;
                continue;
            }

            if (diagnosisCodes.has(comorbidityValue)) {
                skipped.comorbidities += 1;
                continue;
            }

            try {
                await apiRequest("POST", "/api/diagnoses", {
                    profileId,
                    cidCode: comorbidityValue,
                    diagnosisDate: today,
                    status: "cronico",
                    notes: "Comorbidade identificada pela IA",
                });
                created.comorbidities += 1;
                diagnosisCodes.add(comorbidityValue);
            } catch {
                failed.comorbidities += 1;
                remainingRecord.comorbidities.push(comorbidityValue);
            }
        }

        for (const medication of recordToApply.medications || []) {
            const name = medication?.name?.trim();
            if (!name) {
                skipped.medications += 1;
                remainingRecord.medications.push(medication);
                continue;
            }

            try {
                await apiRequest("POST", "/api/medications", {
                    profileId,
                    name,
                    format: medication.format || "comprimido",
                    dosage: medication.dosage || "dose a confirmar",
                    frequency: medication.frequency || "1x ao dia",
                    notes: medication.notes || null,
                    startDate: medication.startDate || today,
                    isActive: medication.isActive !== false,
                });
                created.medications += 1;
            } catch {
                failed.medications += 1;
                remainingRecord.medications.push(medication);
            }
        }

        for (const allergy of recordToApply.allergies || []) {
            const allergen = allergy?.allergen?.trim();
            if (!allergen) {
                skipped.allergies += 1;
                remainingRecord.allergies.push(allergy);
                continue;
            }

            try {
                await apiRequest("POST", "/api/allergies", {
                    profileId,
                    allergen,
                    allergenType: allergy.allergenType || "medication",
                    reaction: allergy.reaction || null,
                    severity: allergy.severity || null,
                    notes: allergy.notes || null,
                });
                created.allergies += 1;
            } catch {
                failed.allergies += 1;
                remainingRecord.allergies.push(allergy);
            }
        }

        for (const surgery of recordToApply.surgeries || []) {
            const procedureName = surgery?.procedureName?.trim();
            const surgeryDate = surgery?.surgeryDate?.trim();
            if (!procedureName || !surgeryDate) {
                skipped.surgeries += 1;
                remainingRecord.surgeries.push(surgery);
                continue;
            }

            try {
                await apiRequest("POST", "/api/surgeries", {
                    procedureName,
                    surgeryDate,
                    hospitalName: surgery.hospitalName || null,
                    surgeonName: surgery.surgeonName || null,
                    notes: surgery.notes || null,
                });
                created.surgeries += 1;
            } catch {
                failed.surgeries += 1;
                remainingRecord.surgeries.push(surgery);
            }
        }

        await Promise.all([
            queryClient.invalidateQueries({ queryKey: ["/api/diagnoses"] }),
            queryClient.invalidateQueries({ queryKey: ["/api/medications"] }),
            queryClient.invalidateQueries({ queryKey: [`/api/medications?profileId=${profileId}`] }),
            queryClient.invalidateQueries({ queryKey: [`/api/medications/history?profileId=${profileId}`] }),
            queryClient.invalidateQueries({ queryKey: ["/api/allergies"] }),
            queryClient.invalidateQueries({ queryKey: [`/api/allergies/patient/${profileId}`] }),
            queryClient.invalidateQueries({ queryKey: ["/api/surgeries"] }),
        ]);

        if (options?.showToast !== false) {
            const createdTotal = countAppliedItems(created);
            const skippedDetails = formatApplyExtractionDetails(skipped);
            const failedDetails = formatApplyExtractionDetails(failed);

            if (createdTotal > 0 && failedDetails.length === 0) {
                toast({
                    title: "Prontuário atualizado",
                    description: `Dados aplicados: ${formatApplyExtractionDetails(created).join(", ")}.${skippedDetails.length ? ` Itens incompletos mantidos para revisão: ${skippedDetails.join(", ")}.` : ""}`,
                });
            } else if (createdTotal > 0) {
                toast({
                    title: "Prontuário atualizado parcialmente",
                    description: `Dados aplicados: ${formatApplyExtractionDetails(created).join(", ")}.${failedDetails.length ? ` Falharam ao salvar: ${failedDetails.join(", ")}.` : ""}${skippedDetails.length ? ` Itens incompletos mantidos para revisão: ${skippedDetails.join(", ")}.` : ""}`,
                });
            } else {
                toast({
                    title: "Falha ao salvar dados",
                    description: failedDetails.length
                        ? `Nenhum item foi aplicado. Falharam ao salvar: ${failedDetails.join(", ")}.${skippedDetails.length ? ` Itens incompletos: ${skippedDetails.join(", ")}.` : ""}`
                        : `Nenhum item foi aplicado porque os dados extraídos estão incompletos.${skippedDetails.length ? ` Pendentes: ${skippedDetails.join(", ")}.` : ""}`,
                    variant: "destructive",
                });
            }
        }

        return {
            created,
            skipped,
            failed,
            remainingRecord,
        };
    };

    const handleApplyExtraction = async (recordToApply?: ExtractedRecord) => {
        const record = recordToApply || extractedRecord;
        if (!record) return;

        setIsApplyingExtraction(true);

        try {
            const result = await applyExtractedRecord(record);
            setExtractedRecord(hasPendingExtractedItems(result.remainingRecord) ? result.remainingRecord : null);
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
        mutationFn: async (data: { text: string; date?: string; profileId: number; recordToApply?: ExtractedRecord | null }) => {
            // 1. Create Evolution
            const { recordToApply: _recordToApply, ...evolutionPayload } = data;
            const res = await apiRequest("POST", "/api/evolutions", evolutionPayload);
            const savedEvo = await res.json();

            // 2. Finalize & Sign (CFM/Digital Signature) automaticaly
            try {
                await apiRequest("POST", `/api/evolutions/${savedEvo.id}/finalize`, { });

                // Return signed evolution
                return { ...savedEvo, isSigned: true };
            } catch (err) {
                console.error("Erro ao assinar evolução:", err);
                // Return saved evolution anyway, but warn user
                throw new Error("Evolução salva, mas falha ao assinar digitalmente.");
            }
        },
        onSuccess: async (_savedEvolution, variables) => {
            let applyResult: ApplyExtractionResult | null = null;

            if (variables.recordToApply) {
                try {
                    applyResult = await applyExtractedRecord(variables.recordToApply, { showToast: false });
                } catch (error) {
                    console.error("Erro ao aplicar dados extraídos:", error);
                }
            }

            const createdDetails = applyResult ? formatApplyExtractionDetails(applyResult.created) : [];
            const skippedDetails = applyResult ? formatApplyExtractionDetails(applyResult.skipped) : [];
            const failedDetails = applyResult ? formatApplyExtractionDetails(applyResult.failed) : [];
            const hasPendingItems = hasPendingExtractedItems(applyResult?.remainingRecord);
            const shouldPreserveExtractedRecord = Boolean(variables.recordToApply && (!applyResult || hasPendingItems));
            const savedExtractionText = createdDetails.length
                ? ` Dados da IA aplicados: ${createdDetails.join(", ")}.`
                : "";
            const pendingExtractionText = skippedDetails.length
                ? ` Itens pendentes para revisão: ${skippedDetails.join(", ")}.`
                : "";
            const failedExtractionText = failedDetails.length
                ? ` Falharam ao salvar: ${failedDetails.join(", ")}. Revise e tente novamente.`
                : "";

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
                        description: `Atendimento concluído, salvo e assinado digitalmente!${savedExtractionText}${pendingExtractionText}${failedExtractionText}`,
                    });
                } catch (err) {
                    console.error("Erro ao atualizar status do agendamento:", err);
                    toast({
                        title: "Consulta registrada",
                        description: `Histórico salvo e assinado, mas houve erro ao atualizar a agenda.${savedExtractionText}${pendingExtractionText}${failedExtractionText}`,
                    });
                }
            } else {
                toast({
                    title: "Consulta registrada",
                    description: `Histórico salvo e assinado com sucesso!${savedExtractionText}${pendingExtractionText}${failedExtractionText}`,
                });
            }
            if (activeProfile?.id && !shouldPreserveExtractedRecord) {
                clearAnamnesisDraft(activeProfile.id, user?.id);
            }
            setAnamnesisText("");
            setExtractedRecord(shouldPreserveExtractedRecord ? (applyResult?.remainingRecord || variables.recordToApply || null) : null);
        },
        onError: (error: any) => {
            toast({
                title: "Erro",
                description: error?.message || "Erro ao salvar consulta. Tente novamente.",
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
        mutationFn: async ({ text }: { text: string; auto?: boolean }) => {
            const res = await apiRequest("POST", "/api/patient-record/enhance", { text });
            return await res.json();
        },
        onSuccess: (data, variables) => {
            setAnamnesisText(normalizeClinicalContent(data.text));
            toast({
                title: variables.auto ? "Anamnese refinada automaticamente" : "Anamnese melhorada",
                description: variables.auto
                    ? "A transcrição foi revisada e formatada pela IA."
                    : "O texto foi reescrito e formatado pela IA.",
            });
        },
        onError: (error: any, variables) => {
            toast({
                title: variables.auto ? "Transcrição carregada com ajustes pendentes" : "Erro ao melhorar texto",
                description: variables.auto
                    ? "A transcrição foi preenchida, mas a melhoria automática não pôde ser concluída."
                    : error?.message || "Não foi possível melhorar o texto.",
                variant: "destructive",
            });
        },
    });

    const handleEnhanceAnamnesis = () => {
        if (!anamnesisPlainText) {
            toast({
                title: "Texto vazio",
                description: "Escreva algo para a IA melhorar.",
                variant: "destructive",
            });
            return;
        }
        enhanceAnamnesisMutation.mutate({ text: anamnesisPlainText });
    };

    const handleAnalyzeAnamnesis = () => {
        if (!anamnesisPlainText) {
            toast({
                title: "Anamnese vazia",
                description: "Descreva o quadro clínico antes de solicitar a análise.",
                variant: "destructive",
            });
            return;
        }
        analyzeAnamnesisMutation.mutate({ text: anamnesisPlainText });
    };

    const syncEditorContent = () => {
        if (!editorRef.current) return;
        const normalized = normalizeClinicalContent(editorRef.current.innerHTML);
        isUpdatingFromEditorRef.current = true;
        setAnamnesisText(normalized);
    };

    const applyEditorCommand = (command: string, value?: string) => {
        editorRef.current?.focus();
        document.execCommand(command, false, value);
        syncEditorContent();
    };

    const handleEditorInput = () => {
        syncEditorContent();
    };

    const handleEditorPaste = (event: ClipboardEvent<HTMLDivElement>) => {
        event.preventDefault();
        const text = event.clipboardData.getData("text/plain");
        document.execCommand("insertText", false, text);
        syncEditorContent();
    };

    const handleEditorBlur = () => {
        if (!editorRef.current) return;
        const normalized = normalizeClinicalContent(editorRef.current.innerHTML);
        editorRef.current.innerHTML = normalized;
        setAnamnesisText(normalized);
    };

    const handleResetAnamnesis = () => {
        if (activeProfile?.id) {
            clearAnamnesisDraft(activeProfile.id, user?.id);
        }
        setAnamnesisText("");
        setExtractedRecord(null);
    };

    return (
        <div className={isMobile ? "space-y-4" : "space-y-8"}>
            <Card className="border border-border shadow-md">
                <CardHeader className={`flex flex-col ${isMobile ? 'gap-2 pb-3' : 'gap-4'}`}>
                    <div>
                        <CardTitle className={`text-foreground ${isMobile ? 'text-lg' : 'text-2xl'}`}>Anamnese inteligente</CardTitle>
                    </div>

                    {/* Destaque para gravação de consulta */}
                    <div className={`flex items-center justify-between rounded-xl border border-red-200/70 dark:border-red-500/35 bg-red-50/75 dark:bg-red-950/25 ${isMobile ? 'p-2.5 gap-2' : 'p-4 gap-4'}`}>
                        <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`shrink-0 rounded-full bg-red-100 dark:bg-red-500/20 border border-red-200/80 dark:border-red-500/35 ${isMobile ? 'p-1.5' : 'p-2'}`}>
                                <Mic className={`text-red-600 dark:text-red-200 ${isMobile ? 'h-4 w-4' : 'h-5 w-5'}`} />
                            </div>
                            <div className="min-w-0">
                                <p className={`font-semibold text-foreground ${isMobile ? 'text-sm' : ''}`}>Transcrição automática</p>
                                {!isMobile && <p className="text-sm text-red-800/80 dark:text-red-100/80">Grave a consulta e a IA preenche a anamnese automaticamente</p>}
                            </div>
                        </div>
                        <FeatureGate feature="ai-recording">
                            <ConsultationRecorder
                                profileId={activeProfile?.id}
                                patientName={activeProfile?.name}
                                returnPath="/atendimento"
                            />
                        </FeatureGate>
                    </div>
                </CardHeader>
                <CardContent className={isMobile ? "space-y-3 px-3 pb-3" : "space-y-4"}>
                    <div className="overflow-hidden rounded-xl border border-border bg-background">
                        <div className="flex flex-wrap items-center gap-1 border-b border-border bg-muted/40 p-2">
                            <Button type="button" variant="ghost" size="sm" className="h-8 px-2" onClick={() => applyEditorCommand("bold")} title="Negrito">
                                <Bold className="h-4 w-4" />
                            </Button>
                            <Button type="button" variant="ghost" size="sm" className="h-8 px-2" onClick={() => applyEditorCommand("italic")} title="Itálico">
                                <Italic className="h-4 w-4" />
                            </Button>
                            <Button type="button" variant="ghost" size="sm" className="h-8 px-2" onClick={() => applyEditorCommand("underline")} title="Sublinhado">
                                <Underline className="h-4 w-4" />
                            </Button>
                            <div className="mx-1 h-5 w-px bg-border" />
                            <Button type="button" variant="ghost" size="sm" className="h-8 px-2" onClick={() => applyEditorCommand("insertUnorderedList")} title="Lista com tópicos">
                                <List className="h-4 w-4" />
                            </Button>
                            <Button type="button" variant="ghost" size="sm" className="h-8 px-2" onClick={() => applyEditorCommand("insertOrderedList")} title="Lista numerada">
                                <ListOrdered className="h-4 w-4" />
                            </Button>
                            <div className="mx-1 h-5 w-px bg-border" />
                            <Button type="button" variant="ghost" size="sm" className="h-8 px-2" onClick={() => applyEditorCommand("undo")} title="Desfazer">
                                <Undo2 className="h-4 w-4" />
                            </Button>
                            <Button type="button" variant="ghost" size="sm" className="h-8 px-2" onClick={() => applyEditorCommand("redo")} title="Refazer">
                                <Redo2 className="h-4 w-4" />
                            </Button>
                            <Button type="button" variant="ghost" size="sm" className="h-8 px-2" onClick={() => applyEditorCommand("removeFormat")} title="Limpar formatação">
                                <RemoveFormatting className="h-4 w-4" />
                            </Button>
                        </div>

                        <div className="relative">
                            {!anamnesisPlainText && (
                                <div className="pointer-events-none absolute left-4 top-3 text-sm text-muted-foreground">
                                    Ex.: Paciente em acompanhamento por hipertensão controlada com losartana 50mg...
                                </div>
                            )}
                            <div
                                ref={editorRef}
                                contentEditable
                                suppressContentEditableWarning
                                role="textbox"
                                aria-multiline="true"
                                onInput={handleEditorInput}
                                onPaste={handleEditorPaste}
                                onBlur={handleEditorBlur}
                                className={`prose prose-sm max-w-none px-4 py-3 outline-none dark:prose-invert prose-p:my-1 prose-ul:my-2 prose-ol:my-2 prose-li:my-0 ${isMobile ? "min-h-[120px] text-sm" : "min-h-[180px]"}`}
                            />
                        </div>
                    </div>
                    <ExamUploadLauncher
                        compact={isMobile}
                        title="Exames no contexto da consulta"
                        description="Envie exames e laudos durante o atendimento."
                        buttonLabel="Enviar exames"
                    />
                    {/* Action buttons */}
                    <div className={isMobile ? "grid grid-cols-2 gap-2" : "flex flex-wrap items-center justify-between gap-3"}>
                        <Button
                            type="button"
                            onClick={() => {
                                if (!anamnesisPlainText) {
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
                                addEvolutionMutation.mutate({
                                    text: anamnesisText,
                                    profileId: activeProfile.id,
                                    recordToApply: extractedRecord,
                                });
                            }}
                            disabled={addEvolutionMutation.isPending || !anamnesisPlainText || !activeProfile?.id}
                            className={`gap-1.5 bg-[#212121] text-white hover:bg-[#424242] ${isMobile ? 'text-xs h-9 order-1 w-full' : 'gap-2'}`}
                        >
                            {addEvolutionMutation.isPending ? (
                                <BrandLoader className={isMobile ? "h-3.5 w-3.5 animate-spin" : "h-4 w-4 animate-spin"} />
                            ) : (
                                <Save className={isMobile ? "h-3.5 w-3.5" : "h-4 w-4"} />
                            )}
                            Salvar Consulta
                        </Button>

                        <FeatureGate feature="ai-enhance">
                            <Button
                                type="button"
                                onClick={handleEnhanceAnamnesis}
                                disabled={enhanceAnamnesisMutation.isPending || !anamnesisPlainText}
                                variant="outline"
                                className={`gap-1.5 text-gray-700 border-gray-200 hover:bg-gray-50 hover:text-gray-900 ${isMobile ? 'text-xs h-9 order-3 w-full' : 'gap-2'}`}
                            >
                                {enhanceAnamnesisMutation.isPending ? (
                                    <BrandLoader className={isMobile ? "h-3.5 w-3.5 animate-spin" : "h-4 w-4 animate-spin"} />
                                ) : (
                                    <Wand2 className={isMobile ? "h-3.5 w-3.5" : "h-4 w-4"} />
                                )}
                                {isMobile ? 'IA Melhorar' : 'Melhorar com IA'}
                            </Button>
                        </FeatureGate>
                        <FeatureGate feature="ai-analyze">
                            <Button
                                type="button"
                                onClick={handleAnalyzeAnamnesis}
                                disabled={analyzeAnamnesisMutation.isPending}
                                className={`gap-1.5 ${isMobile ? 'text-xs h-9 order-4 w-full' : 'gap-2'}`}
                            >
                                {analyzeAnamnesisMutation.isPending ? (
                                    <BrandLoader className={isMobile ? "h-3.5 w-3.5 animate-spin" : "h-4 w-4 animate-spin"} />
                                ) : (
                                    <Sparkles className={isMobile ? "h-3.5 w-3.5" : "h-4 w-4"} />
                                )}
                                {isMobile ? 'Extrair IA' : 'Extrair dados com IA'}
                            </Button>
                        </FeatureGate>
                        <Button type="button" variant="ghost" size={isMobile ? "sm" : "default"} onClick={handleResetAnamnesis} disabled={!anamnesisText && !extractedRecord} className={isMobile ? "text-xs order-2 w-full" : ""}>
                            Limpar texto
                        </Button>
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
                                    <BrandLoader className="h-4 w-4 animate-spin" />
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
