import type { Express, Request, Response } from "express";
import { nanoid } from "nanoid";
import { pool } from "../db";
import logger from "../logger";
import { sendEmail } from "../services/email.service";

type LeadFieldMap = Record<string, string>;

const INTERNAL_LEADS_EMAIL =
  process.env.MARKETING_LEADS_TO ||
  process.env.SALES_LEADS_TO ||
  "contato@vitaview.ai";

const APP_HOSTS = new Set(["vitaview.ai", "www.vitaview.ai", "app.vitaview.ai"]);
let marketingLeadsTableReady: Promise<void> | null = null;

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

async function ensureMarketingLeadsTable() {
  if (!marketingLeadsTableReady) {
    marketingLeadsTableReady = pool
      .query(`
        CREATE TABLE IF NOT EXISTS marketing_leads (
          id SERIAL PRIMARY KEY,
          lead_id TEXT NOT NULL UNIQUE,
          lp_id TEXT NOT NULL,
          offer TEXT,
          name TEXT,
          email TEXT NOT NULL,
          phone TEXT,
          crm TEXT,
          specialty TEXT,
          intent TEXT,
          source TEXT,
          source_detail TEXT,
          utm_campaign TEXT,
          utm_source TEXT,
          utm_medium TEXT,
          utm_content TEXT,
          utm_term TEXT,
          route_to_sales BOOLEAN NOT NULL DEFAULT FALSE,
          redirect_to TEXT,
          status TEXT NOT NULL DEFAULT 'new',
          ip_address TEXT,
          user_agent TEXT,
          payload JSONB NOT NULL DEFAULT '{}'::jsonb,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_marketing_leads_created_at ON marketing_leads(created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_marketing_leads_email ON marketing_leads(email);
        CREATE INDEX IF NOT EXISTS idx_marketing_leads_lp_id ON marketing_leads(lp_id);
      `)
      .then(() => undefined)
      .catch((error) => {
        marketingLeadsTableReady = null;
        throw error;
      });
  }

  await marketingLeadsTableReady;
}

async function persistLead(fields: LeadFieldMap, leadId: string, req: Request) {
  await ensureMarketingLeadsTable();

  await pool.query(
    `
      INSERT INTO marketing_leads (
        lead_id,
        lp_id,
        offer,
        name,
        email,
        phone,
        crm,
        specialty,
        intent,
        source,
        source_detail,
        utm_campaign,
        utm_source,
        utm_medium,
        utm_content,
        utm_term,
        route_to_sales,
        redirect_to,
        ip_address,
        user_agent,
        payload
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21::jsonb
      )
      ON CONFLICT (lead_id) DO NOTHING
    `,
    [
      leadId,
      fields.lp_id,
      fields.offer || null,
      fields.name || null,
      fields.email,
      fields.phone || null,
      fields.crm || null,
      fields.specialty || null,
      fields.intent || null,
      fields.source || null,
      fields.source_detail || null,
      fields.utm_campaign || null,
      fields.utm_source || null,
      fields.utm_medium || null,
      fields.utm_content || null,
      fields.utm_term || null,
      isTruthy(fields.route_to_sales),
      fields.redirect_to || null,
      req.ip || null,
      req.get("user-agent") || null,
      JSON.stringify(fields),
    ],
  );
}

function hasMarketingExportAccess(req: Request) {
  const configuredToken = process.env.MARKETING_EXPORT_TOKEN;
  const providedToken =
    req.get("x-marketing-export-token") ||
    req.query.token?.toString() ||
    req.get("authorization")?.replace(/^Bearer\s+/i, "") ||
    "";

  if (configuredToken && providedToken && providedToken === configuredToken) {
    return true;
  }

  return Boolean(req.isAuthenticated?.() && req.user?.role === "admin");
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
      await persistLead(fields, leadId, req);
    } catch (error) {
      logger.error("[Marketing] Failed to persist lead intake", error);
      return res.status(500).json({ message: "falha ao persistir lead" });
    }

    let emailDelivered = false;
    try {
      const internalEmail = buildInternalEmail(fields, leadId);
      const internalSent = await sendEmail({
        to: INTERNAL_LEADS_EMAIL,
        subject: internalEmail.subject,
        html: internalEmail.html,
        text: internalEmail.text,
      });

      const acknowledgementEmail = buildAcknowledgementEmail(fields);
      const acknowledgementSent = await sendEmail({
        to: email,
        subject: acknowledgementEmail.subject,
        html: acknowledgementEmail.html,
        text: acknowledgementEmail.text,
      });

      emailDelivered = internalSent && acknowledgementSent;

      logger.info("[Marketing] Lead intake registered", {
        leadId,
        lpId,
        offer,
        email,
        routeToSales: isTruthy(fields.route_to_sales),
        emailDelivered,
      });
    } catch (error) {
      logger.error("[Marketing] Lead persisted but email delivery failed", error);
    }

    const payload = {
      success: true,
      leadId,
      lpId,
      offer,
      routeToSales: isTruthy(fields.route_to_sales),
      redirectTo,
      persisted: true,
      emailDelivered,
    };

    if (wantsJsonResponse(req, fields)) {
      return res.status(200).json(payload);
    }

    if (redirectTo) {
      return res.redirect(303, redirectTo);
    }

    return res.status(200).type("html").send(successHtml(redirectTo));
  });

  app.get("/api/marketing/leads/export", async (req: Request, res: Response) => {
    if (!hasMarketingExportAccess(req)) {
      return res.status(401).json({ message: "unauthorized" });
    }

    const limit = Math.min(Math.max(Number(req.query.limit || 100), 1), 500);
    const since = req.query.since?.toString();

    try {
      await ensureMarketingLeadsTable();
      const params: unknown[] = [];
      let whereClause = "";

      if (since) {
        params.push(since);
        whereClause = `WHERE created_at >= $${params.length}::timestamptz`;
      }

      params.push(limit);

      const result = await pool.query(
        `
          SELECT
            lead_id,
            lp_id,
            offer,
            name,
            email,
            phone,
            crm,
            specialty,
            intent,
            source,
            source_detail,
            utm_campaign,
            utm_source,
            utm_medium,
            utm_content,
            utm_term,
            route_to_sales,
            redirect_to,
            status,
            payload,
            created_at,
            updated_at
          FROM marketing_leads
          ${whereClause}
          ORDER BY created_at DESC
          LIMIT $${params.length}
        `,
        params,
      );

      return res.json({
        leads: result.rows,
        count: result.rowCount || 0,
      });
    } catch (error) {
      logger.error("[Marketing] Failed to export leads", error);
      return res.status(500).json({ message: "failed to export marketing leads" });
    }
  });
}
