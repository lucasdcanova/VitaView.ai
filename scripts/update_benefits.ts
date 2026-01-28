
import { db } from "../server/db";
import { subscriptionPlans } from "../shared/schema";
import { eq } from "drizzle-orm";

async function main() {
    console.log("Updating plan benefits...");

    // 1. Update Gratuito
    await db.update(subscriptionPlans)
        .set({
            features: [
                "Anamnese Digital Estruturada",
                "Prescrição Inteligente Ilimitada",
                "Protocolos Clínicos Pré-definidos",
                "Leitura de 10 exames/mês com IA",
                "Gestão Simplificada de Consultas",
                "Gestão de até 20 Pacientes Ativos"
            ]
        })
        .where(eq(subscriptionPlans.name, "Gratuito"));
    console.log("Updated Gratuito benefits");

    // Vita Common Features
    const vitaFeatures = [
        "Anamnese Inteligente com Gravação de Voz",
        "Prescrição Ilimitada com Alerta de Interações",
        "Protocolos de Exames Personalizáveis",
        "Upload Ilimitado de Resultados de Exames",
        "Agendamento Inteligente e Triagem Pré-Consulta",
        "Gestão de Pacientes Ilimitada",
        "Prontuário Eletrônico Completo e Inteligente",
        "Análise Avançada de Tendências de Saúde"
    ];

    // 2. Update Vita Pro
    await db.update(subscriptionPlans)
        .set({ features: vitaFeatures })
        .where(eq(subscriptionPlans.name, "Vita Pro"));
    console.log("Updated Vita Pro benefits");

    // 3. Update Vita Team (Base Vita + Team features)
    await db.update(subscriptionPlans)
        .set({
            features: [
                ...vitaFeatures,
                "Acesso para até 5 Profissionais",
                "Painel Administrativo Centralizado",
                "Ferramentas de Gestão de Equipe",
                "Relatórios de Produtividade Consolidados"
            ]
        })
        .where(eq(subscriptionPlans.name, "Vita Team"));
    console.log("Updated Vita Team benefits");

    // 4. Update Vita Business (Base Vita + Business features)
    await db.update(subscriptionPlans)
        .set({
            features: [
                ...vitaFeatures,
                "Gestão financeira da clínica",
                "Profissionais Ilimitados",
                "API de Integração Dedicada",
                "Personalização White-label (Sua Marca)",
                "Treinamento e Onboarding Dedicado",
                "SLA de Atendimento Garantido"
            ]
        })
        .where(eq(subscriptionPlans.name, "Vita Business"));
    console.log("Updated Vita Business benefits");

    process.exit(0);
}

main();
