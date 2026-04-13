import type { Express, Request, Response } from "express";
import { nanoid } from "nanoid";
import logger from "../logger";
import { sendEmail } from "../services/email.service";

type LeadFieldMap = Record<string, string>;

const INTERNAL_LEADS_EMAIL =
  process.env.MARKETING_LEADS_TO ||
  process.env.SALES_LEADS_TO ||
  "contato@vitaview.ai";

const APP_HOSTS = new Set(["vitaview.ai", "www.vitaview.ai", "app.vitaview.ai"]);

function normalizeFields(body: unknown): LeadFieldMap {
  if (!body || typeof body !== "object") {
    return {};
  }

  const entries = Object.entries(body as Record<string, unknown>).map(([key, value]) => {
    if (Array.isArray(value)) {
      return [key, value.map((item) => String(item ?? "")).join(", ").trim()];
    }
    return [key, String(value ?? "").trim()];
  });

  return Object.fromEntries(entries);
}

function normalizeEmail(value: string | undefined) {
  return (value || "").trim().toLowerCase();
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isTruthy(value: string | undefined) {
  return value === "true" || value === "1" || value === "yes";
}

function sanitizeRedirect(value: string | undefined) {
  if (!value) return null;

  if (value.startsWith("/")) {
    return value;
  }

  try {
    const parsed = new URL(value);
    if (APP_HOSTS.has(parsed.hostname)) {
      return parsed.toString();
    }
  } catch (_error) {
    return null;
  }

  return null;
}

function wantsJsonResponse(req: Request, fields: LeadFieldMap) {
  return (
    fields.response_mode === "json" ||
    req.accepts(["json", "html"]) === "json" ||
    req.get("content-type")?.includes("application/json") ||
    req.get("x-requested-with") === "XMLHttpRequest"
  );
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function buildFieldRows(fields: LeadFieldMap) {
  const orderedKeys = [
    "lp_id",
    "offer",
    "name",
    "email",
    "phone",
    "crm",
    "specialty",
    "intent",
    "source",
    "source_detail",
    "utm_campaign",
    "utm_source",
    "utm_medium",
    "utm_content",
    "utm_term",
    "consultations_per_day",
    "minutes_per_prontuario",
    "hours_per_week",
    "hours_per_year",
  ];

  const rows = orderedKeys
    .filter((key) => fields[key])
    .map(
      (key) =>
        `<tr><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#64748b;font-size:12px;">${escapeHtml(
          key,
        )}</td><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#0f172a;font-size:14px;">${escapeHtml(
          fields[key],
        )}</td></tr>`,
    )
    .join("");

  return rows || '<tr><td colspan="2" style="padding:8px 12px;color:#64748b;">Sem campos adicionais</td></tr>';
}

function buildInternalEmail(fields: LeadFieldMap, leadId: string) {
  const offer = fields.offer || "lead";
  const subject = `[Lead][${offer}] ${fields.lp_id || "sem-lp"} · ${fields.email || "sem-email"}`;
  const html = `
    <div style="font-family:Arial,sans-serif;padding:24px;background:#f8fafc;color:#0f172a;">
      <h1 style="margin:0 0 12px;font-size:22px;">Novo lead capturado</h1>
      <p style="margin:0 0 16px;color:#475569;">Lead ID: <strong>${escapeHtml(leadId)}</strong></p>
      <table style="width:100%;border-collapse:collapse;background:#ffffff;border:1px solid #e5e7eb;">
        ${buildFieldRows(fields)}
      </table>
    </div>
  `;

  const text = Object.entries(fields)
    .filter(([, value]) => value)
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n");

  return { subject, html, text: `Lead ID: ${leadId}\n${text}` };
}

function buildAcknowledgementEmail(fields: LeadFieldMap) {
  const offer = fields.offer || "lead";
  const titleByOffer: Record<string, string> = {
    trial: "Recebemos seu pedido de trial",
    checklist: "Recebemos seu pedido do checklist",
    modelo: "Recebemos seu pedido do modelo",
    calculadora: "Recebemos seu resultado da calculadora",
  };

  const bodyByOffer: Record<string, string> = {
    trial:
      "Seu pedido de trial foi registrado. O próximo passo é concluir seu acesso e começar a testar o Vita Assist na rotina real.",
    checklist:
      "Seu pedido do checklist foi registrado. Você já pode seguir com o material na página e, se fizer sentido, avançar para o trial da VitaView.",
    modelo:
      "Seu pedido do modelo foi registrado. Você já pode consultar a estrutura-base na página e comparar com seu fluxo atual.",
    calculadora:
      "Seu cálculo foi registrado. Você já pode usar o resultado estimado na página para entender quanto tempo o prontuário está consumindo da sua rotina.",
  };

  const title = titleByOffer[offer] || "Recebemos seu contato";
  const body = bodyByOffer[offer] || "Recebemos seu contato e nosso time pode continuar a conversa quando fizer sentido.";

  return {
    subject: `${title} · VitaView AI`,
    html: `
      <div style="font-family:Arial,sans-serif;padding:24px;background:#0f172a;color:#f8fafc;">
        <h1 style="margin:0 0 12px;font-size:24px;">${escapeHtml(title)}</h1>
        <p style="margin:0 0 12px;color:#cbd5e1;line-height:1.6;">${escapeHtml(body)}</p>
        <p style="margin:0;color:#cbd5e1;line-height:1.6;">Se precisar falar com o time, responda este email ou escreva para contato@vitaview.ai.</p>
      </div>
    `,
    text: `${title}\n\n${body}\n\ncontato@vitaview.ai`,
  };
}

function successHtml(redirectTo: string | null) {
  const redirectSnippet = redirectTo
    ? `<p><a href="${escapeHtml(redirectTo)}">Continuar</a></p>`
    : "<p>Seu pedido foi registrado com sucesso.</p>";

  return `<!DOCTYPE html>
  <html lang="pt-BR">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Lead registrado · VitaView AI</title>
    </head>
    <body style="font-family:Arial,sans-serif;padding:40px;background:#f8fafc;color:#0f172a;">
      <h1 style="margin:0 0 12px;">Pedido registrado</h1>
      <p style="margin:0 0 16px;">Seu lead entrou no fluxo da VitaView.</p>
      ${redirectSnippet}
    </body>
  </html>`;
}

export function registerMarketingRoutes(app: Express) {
  app.post("/api/intake/lead", async (req: Request, res: Response) => {
    const fields = normalizeFields(req.body);
    const email = normalizeEmail(fields.email);
    const lpId = fields.lp_id || "";
    const offer = fields.offer || "lead";
    const redirectTo = sanitizeRedirect(fields.redirect_to);
    const leadId = `lead_${new Date().toISOString().slice(0, 10).replaceAll("-", "")}_${nanoid(6)}`;

    if (!lpId) {
      return res.status(400).json({ message: "lp_id é obrigatório" });
    }

    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ message: "email inválido" });
    }

    fields.email = email;

    try {
      const internalEmail = buildInternalEmail(fields, leadId);
      await sendEmail({
        to: INTERNAL_LEADS_EMAIL,
        subject: internalEmail.subject,
        html: internalEmail.html,
        text: internalEmail.text,
      });

      const acknowledgementEmail = buildAcknowledgementEmail(fields);
      await sendEmail({
        to: email,
        subject: acknowledgementEmail.subject,
        html: acknowledgementEmail.html,
        text: acknowledgementEmail.text,
      });

      logger.info("[Marketing] Lead intake registered", {
        leadId,
        lpId,
        offer,
        email,
        routeToSales: isTruthy(fields.route_to_sales),
      });
    } catch (error) {
      logger.error("[Marketing] Failed to process lead intake", error);
      return res.status(500).json({ message: "falha ao registrar lead" });
    }

    const payload = {
      success: true,
      leadId,
      lpId,
      offer,
      routeToSales: isTruthy(fields.route_to_sales),
      redirectTo,
    };

    if (wantsJsonResponse(req, fields)) {
      return res.status(200).json(payload);
    }

    if (redirectTo) {
      return res.redirect(303, redirectTo);
    }

    return res.status(200).type("html").send(successHtml(redirectTo));
  });
}
