import { IStorage } from "../storage";
import logger from "../logger";

// Limite de caracteres para o contexto (aproximadamente 2000 tokens)
const CONTEXT_CHAR_LIMIT = 8000;

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

    /**
     * Gera o contexto "enxuto" focado na pergunta
     */
    async getLeanContext(userId: number, profileId: number, query: string): Promise<string> {
        try {
            const keywords = this.extractKeywords(query);
            const items: ScoredItem[] = [];

            // 1. Dados Básicos (Sempre incluir se existirem, alta prioridade)
            const profile = await this.storage.getProfile(profileId);
            if (!profile) return "Perfil não encontrado.";

            // Buscar dados clínicos
            const [diagnoses, prescriptions, allergies, exams] = await Promise.all([
                this.storage.getDiagnosesByUserId(userId), // Filtraremos por profileId
                this.storage.getPrescriptionsByProfileId(profileId), // Proxy para medicamentos
                this.storage.getAllergiesByProfileId(profileId),
                this.storage.getExamsByUserId(userId, profileId)
            ]);

            // 2. Processar e Pontuar Itens

            // Diagnósticos (Alta prioridade base + relevância)
            diagnoses.filter((d: any) => d.profileId === profileId).forEach((d: any) => {
                const text = `${d.cidCode || ''} ${d.name || ''} ${d.notes || ''}`;
                const score = 50 + this.calculateRelevance(text, keywords); // Base score alto
                items.push({
                    type: 'diagnosis',
                    content: `- Diagnóstico: ${d.cidCode} (${d.status}) - ${d.notes || ''}`,
                    score,
                    date: d.diagnosisDate
                });
            });

            // Alergias (Alta prioridade base)
            allergies.forEach((a: any) => {
                const text = `${a.allergen} ${a.reaction || ''}`;
                const score = 60 + this.calculateRelevance(text, keywords); // Crítico
                items.push({
                    type: 'allergy',
                    content: `- Alergia: ${a.allergen} (${a.severity})`,
                    score
                });
            });

            // Medicamentos (Extraídos das prescrições recentes)
            // Prescrições ativas ou emitidas nos últimos 6 meses
            const recentPrescriptions = prescriptions.filter((p: any) => {
                const date = p.issueDate ? new Date(p.issueDate) : new Date(p.createdAt);
                const diffTime = Math.abs(Date.now() - date.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                return diffDays < 180; // últimos 6 meses
            });

            recentPrescriptions.forEach((p: any) => {
                if (Array.isArray(p.medications)) {
                    p.medications.forEach((m: any) => {
                        const name = m.name || m.medicationName || "Medicamento";
                        const dosage = m.dosage || "";
                        const text = `${name} ${dosage}`;

                        let score = 20; // Base score
                        score += this.calculateRelevance(text, keywords);

                        items.push({
                            type: 'medication',
                            content: `- Medicamento (Receita ${new Date(p.issueDate).toLocaleDateString()}): ${name} ${dosage}`,
                            score,
                            date: p.issueDate ? new Date(p.issueDate).toISOString() : undefined
                        });
                    });
                }
            });

            // Exames (Prioridade baseada em relevância e recência)
            for (const exam of exams) {
                // Tentar obter resultado estruturado se existir (resumo)
                const result = await this.storage.getExamResultByExamId(exam.id);
                const summary = result?.summary || exam.name;

                const text = `${exam.name} ${exam.laboratoryName || ''} ${summary}`;
                let score = this.calculateRelevance(text, keywords);

                // Boost por recência (< 3 meses)
                const examDate = exam.examDate ? new Date(exam.examDate) : new Date(exam.uploadDate);
                const monthsDiff = (Date.now() - examDate.getTime()) / (1000 * 60 * 60 * 24 * 30);

                if (monthsDiff < 3) score += 20;
                if (monthsDiff < 12) score += 5;

                // Só incluir exames sem match se forem muito recentes (< 1 mês)
                if (score === 0 && monthsDiff < 1) score = 5;

                if (score > 0) {
                    items.push({
                        type: 'exam',
                        content: `- Exame (${examDate.toLocaleDateString()}): ${exam.name}\n  Resumo: ${summary.substring(0, 300)}...`,
                        score,
                        date: (exam.examDate || exam.uploadDate) ? new Date(exam.examDate || exam.uploadDate).toISOString() : undefined
                    });
                }
            }

            // 3. Ordenar e Truncar
            items.sort((a, b) => b.score - a.score);

            let contextBuilder = `DADOS DO PACIENTE:\nNome: ${profile.name}\nIdade: ${profile.birthDate ? this.calculateAge(profile.birthDate) : 'N/A'}\nSexo: ${profile.gender}\n\nCONTEXTO CLÍNICO RELEVANTE:\n`;
            let currentLength = contextBuilder.length;

            for (const item of items) {
                if (currentLength + item.content.length > CONTEXT_CHAR_LIMIT) {
                    break; // Stop adding items once limit reached
                }
                contextBuilder += item.content + "\n";
                currentLength += item.content.length + 1;
            }

            if (items.length === 0) {
                contextBuilder += "Nenhuma informação clínica adicional encontrada para este contexto.";
            }

            logger.info(`[ContextManager] Lean context generated. Keywords: [${keywords.join(', ')}]. Items: ${items.length}. Size: ${contextBuilder.length} chars.`);
            return contextBuilder;

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
