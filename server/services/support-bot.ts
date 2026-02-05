
import { db } from "../db";
import { supportTickets, supportMessages, type InsertSupportTicket, type InsertSupportMessage } from "@shared/schema";
import { knowledgeBaseService } from "./knowledge-base";
import { openai } from "./openai";
import { ModelRouter } from "./model-router";
import logger from "../logger";

export class SupportBotService {

    async handleChat(userId: number, message: string, clinicId?: number): Promise<{ response: string, suggestedActions?: string[] }> {
        try {
            // 1. Search Knowledge Base
            const articles = await knowledgeBaseService.searchArticles(message, 3, clinicId);

            const context = articles.map(a => `Title: ${a.title}\nContent: ${a.content}`).join("\n\n");

            // 2. Construct Prompt
            const systemPrompt = `Você é o Vitabot, um assistente de suporte inteligente do VitaView.
      Use o contexto abaixo para responder à pergunta do usuário.
      Se a resposta não estiver no contexto, diga que não sabe e sugira falar com o suporte humano.
      Seja conciso, educado e profissional.
      
      Contexto:
      ${context}
      `;

            // 3. Call OpenAI
            if (!openai) throw new Error("OpenAI not initialized");

            const response = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: message }
                ],
                temperature: 0.3,
            });

            const aiResponse = response.choices[0].message.content || "Desculpe, não consegui processar sua solicitação.";

            // 4. Determine actions (Simple heuristic)
            const suggestedActions: string[] = [];
            if (aiResponse.includes("suporte humano") || aiResponse.includes("abrir um chamado")) {
                suggestedActions.push("open_ticket");
            }

            return {
                response: aiResponse,
                suggestedActions
            };

        } catch (error) {
            logger.error("[SupportBot] Chat error", { error });
            return { response: "Ocorreu um erro. Por favor, tente novamente ou contate o suporte." };
        }
    }

    async createTicket(userId: number, subject: string, message: string, clinicId?: number) {
        // Create Ticket
        const [ticket] = await db.insert(supportTickets).values({
            userId,
            clinicId,
            subject,
            status: "open",
            source: "bot"
        }).returning();

        // Add initial message
        await db.insert(supportMessages).values({
            ticketId: ticket.id,
            senderType: "user",
            senderId: userId,
            content: message
        });

        return ticket;
    }
}

export const supportBotService = new SupportBotService();
