import logger from "../logger";

export type TaskComplexity = 'simple' | 'medium' | 'complex';

interface ModelConfig {
    id: string;
    inputCostPer1k: number;
    outputCostPer1k: number;
}

// Configuração de janelas de contexto e preços (estimados)
export const AVAILABLE_MODELS: Record<string, ModelConfig> = {
    'gpt-4o-mini': { id: 'gpt-4o-mini', inputCostPer1k: 0.00015, outputCostPer1k: 0.0006 },
    'gpt-4o': { id: 'gpt-4o', inputCostPer1k: 0.005, outputCostPer1k: 0.015 },
    'o1-mini': { id: 'o1-mini', inputCostPer1k: 0.003, outputCostPer1k: 0.012 }, // Raciocínio rápido e barato
    'o1-preview': { id: 'o1-preview', inputCostPer1k: 0.015, outputCostPer1k: 0.06 } // Raciocínio complexo
};

export const ROUTING_CONFIG: Record<TaskComplexity, string> = {
    simple: 'gpt-4o-mini',
    medium: 'gpt-4o',
    complex: 'o1-mini' // Complex reasoning default
};

export class ModelRouter {
    /**
     * Determina o melhor modelo para uma dada tarefa e complexidade.
     * Permite override explícito.
     */
    static getModel(taskName: string, complexity: TaskComplexity, overrideModel?: string): string {
        if (overrideModel && AVAILABLE_MODELS[overrideModel]) {
            logger.info(`[ModelRouter] Override applied for task '${taskName}': ${overrideModel}`);
            return overrideModel;
        }

        const selectedModel = ROUTING_CONFIG[complexity];
        logger.debug(`[ModelRouter] Selected model for '${taskName}' (${complexity}): ${selectedModel}`);
        return selectedModel;
    }

    /**
     * Registra o custo estimado da operação.
     */
    static trackUsage(
        taskName: string,
        modelId: string,
        usage: { prompt_tokens: number; completion_tokens: number }
    ) {
        const config = AVAILABLE_MODELS[modelId];
        if (!config) {
            logger.warn(`[ModelRouter] Unknown model '${modelId}' used in '${taskName}'`);
            return;
        }

        const inputCost = (usage.prompt_tokens / 1000) * config.inputCostPer1k;
        const outputCost = (usage.completion_tokens / 1000) * config.outputCostPer1k;
        const totalCost = inputCost + outputCost;

        logger.info(`[ModelRouter] Usage stats`, {
            task: taskName,
            model: modelId,
            tokens: usage,
            estimatedCost: totalCost.toFixed(6)
        });
    }
}
