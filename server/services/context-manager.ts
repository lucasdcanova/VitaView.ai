import { IStorage } from "../storage";
import logger from "../logger";
import { stripClinicalHtml } from "@shared/clinical-rich-text";

// Limite maior para permitir que o Vita Assist veja o histórico clínico inteiro
// em formato condensado, sem estourar desnecessariamente o contexto do modelo.
const CONTEXT_CHAR_LIMIT = 24000;
const ITEM_EXCERPT_LIMIT = 280;

interface ScoredItem {
    type: 'exam' | 'medication' | 'diagnosis' | 'allergy' | 'evolution';
    content: string;
    score: number;
    date?: string;
}

export class ContextManager {
    private storage: IStorage;

    constructor(storage: IStorage) {
        this.storage = storage;
    }

    /**
     * Extrai palavras-chave relevantes da pergunta do usuário
     */
    private extractKeywords(query: string): string[] {
        if (!query) return [];

        // Lista de stop words em português para ignorar
        const stopWords = new Set([
            'o', 'a', 'os', 'as', 'um', 'uma', 'uns', 'umas',
            'de', 'do', 'da', 'dos', 'das', 'em', 'no', 'na', 'nos', 'nas',
            'por', 'pelo', 'pela', 'pelos', 'pelas', 'para', 'pra',
            'que', 'com', 'e', 'ou', 'mas', 'se', 'nem',
            'eu', 'tu', 'ele', 'ela', 'nós', 'vós', 'eles', 'elas',
            'meu', 'minha', 'teu', 'tua', 'seu', 'sua',
            'qual', 'quais', 'quem', 'como', 'quando', 'onde', 'porque',
            'é', 'era', 'foi', 'ser', 'estar', 'ter', 'haver',
            'fazer', 'ir', 'vir', 'ver', 'dar', 'dizer',
            'hoje', 'amanhã', 'ontem', 'agora', 'então', 'assim',
            'gostaria', 'quero', 'preciso', 'poderia', 'pode',
            'sobre', 'analise', 'veja', 'mostre', 'resuma'
        ]);

        return query
            .toLowerCase()
            .replace(/[.,?!;:]/g, '') // Remover pontuação
            .split(/\s+/)
            .filter(w => w.length > 2 && !stopWords.has(w));
    }

    /**
     * Calcula pontuação de relevância para um texto baseado nas keywords
     */
    private calculateRelevance(text: string, keywords: string[]): number {
        if (!text || keywords.length === 0) return 0;

        const lowerText = text.toLowerCase();
        let score = 0;

        keywords.forEach(keyword => {
            if (lowerText.includes(keyword)) {
                score += 10; // Match exato
            }
        });

        return score;
    }

    private normalizeText(value: unknown): string {
        if (value === null || value === undefined) return "";
        if (typeof value === "string") return stripClinicalHtml(value).replace(/\s+/g, " ").trim();
        return String(value).replace(/\s+/g, " ").trim();
    }

    private truncateText(value: unknown, maxLength: number = ITEM_EXCERPT_LIMIT): string {
        const normalized = this.normalizeText(value);
        if (!normalized) return "";
        if (normalized.length <= maxLength) return normalized;
        return `${normalized.slice(0, Math.max(0, maxLength - 3)).trim()}...`;
    }

    private formatDate(value: unknown): string {
        if (!value) return "data não informada";

        const date = value instanceof Date ? value : new Date(String(value));
        if (Number.isNaN(date.getTime())) {
            return this.normalizeText(value) || "data não informada";
        }

        return date.toLocaleDateString("pt-BR");
    }

    private appendSection(
        builder: string,
        title: string,
        lines: string[],
        limit: number = CONTEXT_CHAR_LIMIT
    ): string {
        if (!lines.length) return builder;

        const header = `${title}:\n`;
        if (builder.length + header.length > limit) return builder;

        let nextBuilder = `${builder}${header}`;

        for (const line of lines) {
            const entry = `- ${line}\n`;
            if (nextBuilder.length + entry.length > limit) {
                return `${nextBuilder}[seção truncada por limite de contexto]\n\n`;
            }
            nextBuilder += entry;
        }

        return `${nextBuilder}\n`;
    }

    private formatMetricLine(metric: any): string {
        const metricName = this.normalizeText(metric?.name || "Métrica");
        const metricValue = this.normalizeText(metric?.value);
        const unit = this.normalizeText(metric?.unit);
        const status = this.normalizeText(metric?.status);
        const date = this.formatDate(metric?.date);
        const referenceMin = this.normalizeText(metric?.referenceMin);
        const referenceMax = this.normalizeText(metric?.referenceMax);

        const referenceRange = referenceMin || referenceMax
            ? ` | ref: ${referenceMin || "?"}-${referenceMax || "?"}${unit ? ` ${unit}` : ""}`
            : "";

        return `${date} | ${metricName}: ${metricValue}${unit ? ` ${unit}` : ""}${status ? ` (${status})` : ""}${referenceRange}`;
    }

    /**
     * Gera um contexto clínico integral, condensando todo o histórico do paciente
     * em seções organizadas para o Vita Assist responder com base no prontuário.
     */
    async getLeanContext(userId: number, profileId: number, query: string, clinicId?: number): Promise<string> {
        try {
            const keywords = this.extractKeywords(query);
            const profile =
                await this.storage.getProfile(profileId, clinicId) ??
                await this.storage.getProfile(profileId);

            if (!profile) return "Perfil não encontrado.";

            const dataOwnerUserId = profile.userId ?? userId;

            const [
                allDiagnoses,
                surgeries,
                allergies,
                exams,
                evolutions,
                triageHistory,
                prescriptions,
                healthMetrics,
            ] = await Promise.all([
                this.storage.getDiagnosesByUserId(dataOwnerUserId),
                this.storage.getSurgeriesByUserId(dataOwnerUserId),
                this.storage.getAllergiesByProfileId(profileId),
                this.storage.getExamsByUserId(dataOwnerUserId, profileId, clinicId),
                this.storage.getEvolutionsByProfileId(dataOwnerUserId, profileId),
                this.storage.getTriageHistoryByProfileId(profileId),
                this.storage.getPrescriptionsByProfileId(profileId),
                this.storage.getHealthMetricsByUserId(dataOwnerUserId, profileId, clinicId),
            ]);

            const diagnoses = allDiagnoses
                .filter((diagnosis: any) => diagnosis.profileId === profileId)
                .sort((a: any, b: any) =>
                    new Date(b.diagnosisDate || b.createdAt || 0).getTime() -
                    new Date(a.diagnosisDate || a.createdAt || 0).getTime()
                );

            const examResults = await Promise.all(
                exams.map((exam: any) => this.storage.getExamResultByExamId(exam.id))
            );

            const activeDiagnoses = diagnoses.filter((diagnosis: any) =>
                ["ativo", "em_tratamento", "cronico"].includes(this.normalizeText(diagnosis.status).toLowerCase())
            );

            const relevantMetrics = healthMetrics
                .filter((metric: any) => this.normalizeText(metric.status).toLowerCase() !== "normal")
                .sort((a: any, b: any) =>
                    new Date(b.date || b.createdAt || 0).getTime() -
                    new Date(a.date || a.createdAt || 0).getTime()
                )
                .slice(0, 20);

            const prescriptionLines = prescriptions
                .slice()
                .sort((a: any, b: any) =>
                    new Date(b.issueDate || b.createdAt || 0).getTime() -
                    new Date(a.issueDate || a.createdAt || 0).getTime()
                )
                .map((prescription: any) => {
                    const medications = Array.isArray(prescription.medications) ? prescription.medications : [];
                    const medicationSummary = medications.length > 0
                        ? medications.map((medication: any) => {
                            const name = this.normalizeText(
                                medication?.name ||
                                medication?.medicationName ||
                                medication?.drugName ||
                                "Medicamento"
                            );
                            const dosage = this.normalizeText(
                                medication?.dosage ||
                                medication?.dose ||
                                medication?.quantity
                            );
                            return dosage ? `${name} ${dosage}` : name;
                        }).join("; ")
                        : "sem medicamentos detalhados";

                    const observations = this.truncateText(prescription.observations, 120);
                    return `${this.formatDate(prescription.issueDate || prescription.createdAt)} | ${medicationSummary}${observations ? ` | Obs: ${observations}` : ""}`;
                });

            const diagnosisLines = diagnoses.map((diagnosis: any) => {
                const cidCode = this.normalizeText(diagnosis.cidCode || "CID não informado");
                const status = this.normalizeText(diagnosis.status);
                const notes = this.truncateText(diagnosis.notes, 140);
                return `${this.formatDate(diagnosis.diagnosisDate || diagnosis.createdAt)} | ${cidCode}${status ? ` | status: ${status}` : ""}${notes ? ` | ${notes}` : ""}`;
            });

            const allergyLines = allergies.map((allergy: any) => {
                const allergen = this.normalizeText(allergy.allergen);
                const reaction = this.truncateText(allergy.reaction, 100);
                const severity = this.normalizeText(allergy.severity);
                const notes = this.truncateText(allergy.notes, 100);
                return `${allergen}${severity ? ` | gravidade: ${severity}` : ""}${reaction ? ` | reação: ${reaction}` : ""}${notes ? ` | ${notes}` : ""}`;
            });

            const surgeryLines = surgeries
                .slice()
                .sort((a: any, b: any) =>
                    new Date(b.surgeryDate || b.createdAt || 0).getTime() -
                    new Date(a.surgeryDate || a.createdAt || 0).getTime()
                )
                .map((surgery: any) => {
                    const procedureName = this.normalizeText(surgery.procedureName || "Cirurgia");
                    const hospitalName = this.normalizeText(surgery.hospitalName);
                    const surgeonName = this.normalizeText(surgery.surgeonName);
                    const notes = this.truncateText(surgery.notes, 120);
                    return `${this.formatDate(surgery.surgeryDate || surgery.createdAt)} | ${procedureName}${hospitalName ? ` | hospital: ${hospitalName}` : ""}${surgeonName ? ` | cirurgião: ${surgeonName}` : ""}${notes ? ` | ${notes}` : ""}`;
                });

            const examLines = exams
                .slice()
                .sort((a: any, b: any) =>
                    new Date(b.examDate || b.uploadDate || b.createdAt || 0).getTime() -
                    new Date(a.examDate || a.uploadDate || a.createdAt || 0).getTime()
                )
                .map((exam: any) => {
                    const result = examResults.find((examResult: any) => examResult?.examId === exam.id);
                    const summary = this.truncateText(
                        result?.summary ||
                        exam?.summary ||
                        exam?.laboratoryName ||
                        exam?.name,
                        180
                    );
                    const examName = this.normalizeText(exam.name || exam.title || "Exame");
                    const laboratoryName = this.normalizeText(exam.laboratoryName);
                    const examDate = this.formatDate(exam.examDate || exam.uploadDate || exam.createdAt);
                    return `${examDate} | ${examName}${laboratoryName ? ` | laboratório: ${laboratoryName}` : ""}${summary ? ` | resumo: ${summary}` : ""}`;
                });

            const evolutionLines = evolutions
                .slice()
                .sort((a: any, b: any) =>
                    new Date(b.date || b.createdAt || 0).getTime() -
                    new Date(a.date || a.createdAt || 0).getTime()
                )
                .map((evolution: any) => {
                    const professionalName = this.normalizeText(evolution.professionalName || "Profissional");
                    const text = this.truncateText(evolution.text, 220);
                    return `${this.formatDate(evolution.date || evolution.createdAt)} | ${professionalName}: ${text}`;
                });

            const triageLines = triageHistory
                .slice()
                .sort((a: any, b: any) =>
                    new Date(b.createdAt || b.updatedAt || 0).getTime() -
                    new Date(a.createdAt || a.updatedAt || 0).getTime()
                )
                .map((triage: any) => {
                    const vitals = [
                        triage.systolicBp && triage.diastolicBp ? `PA ${triage.systolicBp}/${triage.diastolicBp}` : null,
                        triage.heartRate ? `FC ${triage.heartRate}` : null,
                        triage.temperature ? `Temp ${triage.temperature}` : null,
                        triage.oxygenSaturation ? `SpO2 ${triage.oxygenSaturation}` : null,
                        triage.bloodGlucose ? `Glic ${triage.bloodGlucose}` : null,
                    ].filter(Boolean).join(", ");

                    const parts = [
                        this.formatDate(triage.createdAt || triage.updatedAt),
                        this.normalizeText(triage.chiefComplaint || "Triagem"),
                        this.truncateText(triage.currentIllnessHistory, 180),
                        vitals,
                        triage.painScale !== null && triage.painScale !== undefined ? `dor ${triage.painScale}/10` : "",
                        this.truncateText(triage.notes, 100),
                    ].filter(Boolean);

                    return parts.join(" | ");
                });

            let contextBuilder = [
                "CONTEXTO CLÍNICO INTEGRAL DO PACIENTE",
                "Use este histórico como base principal da resposta. Se algo não estiver registrado aqui, deixe isso explícito.",
                "",
                "DADOS DO PACIENTE:",
                `- Nome: ${profile.name}`,
                `- Idade: ${profile.birthDate ? this.calculateAge(profile.birthDate) : "N/A"}`,
                `- Sexo: ${this.normalizeText(profile.gender) || "não informado"}`,
                `- Tipo sanguíneo: ${this.normalizeText((profile as any).bloodType) || "não informado"}`,
                `- Convênio: ${this.normalizeText((profile as any).insuranceName) || "não informado"}`,
                `- Observações cadastrais: ${this.truncateText((profile as any).notes, 160) || "sem observações"}`,
                "",
                `FOCO DA PERGUNTA ATUAL: ${this.normalizeText(query) || "não informado"}`,
                "",
            ].join("\n");

            contextBuilder = this.appendSection(contextBuilder, "RESUMO CLÍNICO", [
                `Diagnósticos ativos/crônicos: ${activeDiagnoses.length > 0 ? activeDiagnoses.map((diagnosis: any) => this.normalizeText(diagnosis.cidCode)).join(", ") : "nenhum registrado"}`,
                `Alergias relevantes: ${allergies.length > 0 ? allergies.map((allergy: any) => this.normalizeText(allergy.allergen)).join(", ") : "nenhuma registrada"}`,
                `Prescrições no prontuário: ${prescriptions.length}`,
                `Evoluções registradas: ${evolutions.length}`,
                `Exames registrados: ${exams.length}`,
                `Triagens registradas: ${triageHistory.length}`,
            ]);

            contextBuilder = this.appendSection(
                contextBuilder,
                "ALTERAÇÕES LABORATORIAIS RELEVANTES",
                relevantMetrics.length > 0
                    ? relevantMetrics.map((metric: any) => this.formatMetricLine(metric))
                    : ["Nenhuma alteração laboratorial relevante registrada."]
            );

            contextBuilder = this.appendSection(
                contextBuilder,
                `DIAGNÓSTICOS (${diagnosisLines.length})`,
                diagnosisLines.length > 0 ? diagnosisLines : ["Nenhum diagnóstico registrado."]
            );

            contextBuilder = this.appendSection(
                contextBuilder,
                `ALERGIAS (${allergyLines.length})`,
                allergyLines.length > 0 ? allergyLines : ["Nenhuma alergia registrada."]
            );

            contextBuilder = this.appendSection(
                contextBuilder,
                `PRESCRIÇÕES E MEDICAÇÕES (${prescriptionLines.length})`,
                prescriptionLines.length > 0 ? prescriptionLines : ["Nenhuma prescrição registrada."]
            );

            contextBuilder = this.appendSection(
                contextBuilder,
                `CIRURGIAS E PROCEDIMENTOS (${surgeryLines.length})`,
                surgeryLines.length > 0 ? surgeryLines : ["Nenhuma cirurgia registrada."]
            );

            contextBuilder = this.appendSection(
                contextBuilder,
                `TRIAGENS E QUEIXAS (${triageLines.length})`,
                triageLines.length > 0 ? triageLines : ["Nenhuma triagem registrada."]
            );

            contextBuilder = this.appendSection(
                contextBuilder,
                `EVOLUÇÕES CLÍNICAS (${evolutionLines.length})`,
                evolutionLines.length > 0 ? evolutionLines : ["Nenhuma evolução registrada."]
            );

            contextBuilder = this.appendSection(
                contextBuilder,
                `EXAMES E RESULTADOS (${examLines.length})`,
                examLines.length > 0 ? examLines : ["Nenhum exame registrado."]
            );

            logger.info("[ContextManager] Comprehensive patient context generated", {
                profileId,
                clinicId,
                ownerUserId: dataOwnerUserId,
                keywords,
                diagnoses: diagnosisLines.length,
                allergies: allergyLines.length,
                prescriptions: prescriptionLines.length,
                surgeries: surgeryLines.length,
                triages: triageLines.length,
                evolutions: evolutionLines.length,
                exams: examLines.length,
                relevantMetrics: relevantMetrics.length,
                size: contextBuilder.length,
            });

            return contextBuilder.slice(0, CONTEXT_CHAR_LIMIT);

        } catch (error) {
            logger.error("[ContextManager] Error generating context", error);
            return "Erro ao recuperar contexto clínico.";
        }
    }

    private calculateAge(birthDateStr: string): number {
        const birthDate = new Date(birthDateStr);
        const ageDifMs = Date.now() - birthDate.getTime();
        const ageDate = new Date(ageDifMs);
        return Math.abs(ageDate.getUTCFullYear() - 1970);
    }
}
