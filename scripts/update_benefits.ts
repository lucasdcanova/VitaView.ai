
import { db } from "../server/db";
import { subscriptionPlans } from "../shared/schema";
import { eq } from "drizzle-orm";

async function main() {
    console.log("Updating plan benefits...");

    // 1. Update Gratuito
    await db.update(subscriptionPlans)
        .set({
            features: [
                "Atendimento: Anamnese básica",
                "Prescrição: Ilimitada",
                "Exames: Protocolos clínicos básicos",
                "Envio de resultados: 10 uploads/mês (1 arquivo por vez)",
                "Agenda: Básica",
                "Pacientes: Limite de 20 pacientes"
            ]
        })
        .where(eq(subscriptionPlans.name, "Gratuito"));
    console.log("Updated Gratuito benefits");

    // Vita Common Features
    const vitaFeatures = [
        "Atendimento: Anamnese com gravação e IA",
        "Prescrição: Ilimitada + Alerta de interações",
        "Exames: Protocolos editáveis e personalizados",
        "Envio de resultados: Uploads ilimitados",
        "Agenda: Marcação com IA e triagem",
        "Pacientes: Ilimitados",
        "Prontuário inteligente completo",
        "Análise de tendências de saúde"
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
                "Até 5 profissionais inclusos",
                "Conta administradora",
                "Gerenciamento de equipe",
                "Relatórios consolidados"
            ]
        })
        .where(eq(subscriptionPlans.name, "Vita Team"));
    console.log("Updated Vita Team benefits");

    // 4. Update Vita Business (Base Vita + Business features)
    await db.update(subscriptionPlans)
        .set({
            features: [
                ...vitaFeatures,
                "Profissionais ilimitados (5+)",
                "Gestão financeira da clínica",
                "API de integração",
                "Gerente de conta dedicado",
                "Personalização Whitelabel"
            ]
        })
        .where(eq(subscriptionPlans.name, "Vita Business"));
    console.log("Updated Vita Business benefits");

    process.exit(0);
}

main();
