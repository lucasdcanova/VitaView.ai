import nodemailer from 'nodemailer';
import logger from '../logger';

interface EmailOptions {
    to: string;
    subject: string;
    html: string;
    text?: string;
}

const createTransporter = () => {
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
        return nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    }
    logger.info('[Email] SMTP not configured - emails will be logged to console');
    return null;
};

const transporter = createTransporter();

export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
    const from = process.env.EMAIL_FROM || 'VitaView AI <contato@vitaview.ai>';

    if (!transporter) {
        logger.info(`[Email Mock] To: ${options.to} | Subject: ${options.subject}`);
        return true;
    }

    try {
        await transporter.sendMail({ from, ...options });
        logger.info(`[Email] Sent to ${options.to} — ${options.subject}`);
        return true;
    } catch (error) {
        logger.error('[Email] Failed to send:', error);
        return false;
    }
};

// ─── Design system ────────────────────────────────────────────────────────────

const YEAR = new Date().getFullYear();
const BASE_URL = () => process.env.APP_URL || 'https://vitaview.ai';

function em(content: string): string {
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>VitaView AI</title>
</head>
<body style="margin:0;padding:0;background-color:#e4e4e1;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#e4e4e1;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

        <!-- HEADER -->
        <tr>
          <td style="background-color:#ffffff;padding:26px 40px;border-radius:4px 4px 0 0;text-align:center;">
            <img src="https://vitaview.ai/LOGO%20COM%20TEXTO.PNG" width="190" height="auto" alt="VitaView AI" style="display:inline-block;border:0;max-width:190px;">
          </td>
        </tr>

        <!-- TEAL DIVIDER -->
        <tr><td style="height:3px;background-color:#448C9B;font-size:0;line-height:0;">&nbsp;</td></tr>

        <!-- BODY -->
        <tr>
          <td style="background-color:#111111;padding:48px 40px 40px;">
            ${content}
          </td>
        </tr>

        <!-- FOOTER -->
        <tr>
          <td style="background-color:#0a0a0a;padding:22px 40px;border-top:1px solid #1e1e1e;border-radius:0 0 4px 4px;">
            <p style="margin:0;font-size:12px;color:#444;line-height:1.8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
              © ${YEAR} VitaView AI · Todos os direitos reservados<br>
              <a href="https://vitaview.ai" style="color:#444;text-decoration:none;">vitaview.ai</a>
              &nbsp;·&nbsp;
              <a href="mailto:contato@vitaview.ai" style="color:#444;text-decoration:none;">contato@vitaview.ai</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

const h1 = (t: string) =>
    `<h1 style="margin:0 0 16px;font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:normal;color:#ffffff;letter-spacing:-0.5px;line-height:1.3;">${t}</h1>`;

const p = (t: string) =>
    `<p style="margin:0 0 14px;font-size:15px;color:#999;line-height:1.75;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">${t}</p>`;

const strong = (t: string) => `<strong style="color:#ffffff;">${t}</strong>`;

const hr = () =>
    `<table width="100%" cellpadding="0" cellspacing="0" style="margin:32px 0 0;"><tr><td style="height:1px;background-color:#1e1e1e;font-size:0;">&nbsp;</td></tr></table>`;

const small = (t: string) =>
    `<p style="margin:20px 0 0;font-size:13px;color:#444;line-height:1.6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">${t}</p>`;

const btn = (label: string, url: string) => `
    <table cellpadding="0" cellspacing="0" style="margin:28px 0;">
      <tr>
        <td style="background-color:#ffffff;">
          <a href="${url}" style="display:inline-block;padding:13px 30px;color:#111111;text-decoration:none;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;font-weight:600;letter-spacing:0.2px;">${label}</a>
        </td>
      </tr>
    </table>`;

// Info box (for receipts / plan details)
const infoBox = (rows: Array<[string, string]>) => `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;background-color:#1a1a1a;border-radius:4px;">
      ${rows.map(([label, value]) => `
      <tr>
        <td style="padding:12px 20px;font-size:13px;color:#666;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;border-bottom:1px solid #222;">${label}</td>
        <td style="padding:12px 20px;font-size:13px;color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;border-bottom:1px solid #222;text-align:right;">${value}</td>
      </tr>`).join('')}
    </table>`;

// ─── Welcome ──────────────────────────────────────────────────────────────────

export const sendWelcomeEmail = async (email: string, fullName: string): Promise<boolean> => {
    const firstName = fullName.split(' ')[0];

    const html = em(`
        ${h1(`Bem-vindo, ${firstName}.`)}
        ${p(`Sua conta no VitaView AI está pronta. Você tem acesso a uma plataforma completa para gestão de pacientes, prontuários eletrônicos e análise clínica com inteligência artificial.`)}
        ${p(`Comece criando sua clínica, adicionando pacientes ou enviando exames para análise.`)}
        ${btn('Acessar VitaView AI →', BASE_URL())}
        ${hr()}
        ${small(`Dúvidas? <a href="mailto:contato@vitaview.ai" style="color:#444;">contato@vitaview.ai</a>`)}
    `);

    return sendEmail({
        to: email,
        subject: `Bem-vindo ao VitaView AI`,
        html,
        text: `Bem-vindo ao VitaView AI, ${firstName}! Sua conta está pronta. Acesse: ${BASE_URL()}`,
    });
};

// ─── Clinic invitation ────────────────────────────────────────────────────────

export const sendClinicInvitationEmail = async (
    email: string,
    clinicName: string,
    inviteToken: string,
    invitedByName: string
): Promise<boolean> => {
    const inviteUrl = `${BASE_URL()}/accept-invitation/${inviteToken}`;

    const html = em(`
        ${h1(`Convite para ${clinicName}`)}
        ${p(`${strong(invitedByName)} convidou você para fazer parte da equipe de ${strong(clinicName)} no VitaView AI.`)}
        ${p(`Como membro da clínica, você terá acesso a recursos compartilhados para gestão de pacientes e prontuários com inteligência artificial.`)}
        ${btn('Aceitar convite →', inviteUrl)}
        ${hr()}
        ${small(`Este convite expira em 7 dias. Não esperava receber este email? Pode ignorá-lo com segurança.`)}
    `);

    return sendEmail({
        to: email,
        subject: `Convite para ${clinicName} · VitaView AI`,
        html,
        text: `${invitedByName} convidou você para ${clinicName} no VitaView AI.\n\nAcesse: ${inviteUrl}\n\nExpira em 7 dias.`,
    });
};

// ─── Password reset ───────────────────────────────────────────────────────────

export const sendPasswordResetEmail = async (
    email: string,
    fullName: string,
    resetToken: string
): Promise<boolean> => {
    const firstName = fullName.split(' ')[0];
    const resetUrl = `${BASE_URL()}/reset-password/${resetToken}`;

    const html = em(`
        ${h1(`Redefinição de senha`)}
        ${p(`Olá, ${firstName}. Recebemos uma solicitação para redefinir a senha da sua conta.`)}
        ${p(`Este link é válido por ${strong('1 hora')}. Após esse prazo, solicite um novo.`)}
        ${btn('Redefinir senha →', resetUrl)}
        ${hr()}
        ${small(`Não solicitou a redefinição? Ignore este email — sua senha permanece inalterada.<br>Dúvidas: <a href="mailto:contato@vitaview.ai" style="color:#444;">contato@vitaview.ai</a>`)}
    `);

    return sendEmail({
        to: email,
        subject: `Redefinição de senha · VitaView AI`,
        html,
        text: `Acesse o link para redefinir sua senha:\n${resetUrl}\n\nVálido por 1 hora.`,
    });
};

// ─── Password changed ─────────────────────────────────────────────────────────

export const sendPasswordChangedEmail = async (email: string, fullName: string): Promise<boolean> => {
    const firstName = fullName.split(' ')[0];
    const now = new Date().toLocaleString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        day: '2-digit', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });

    const html = em(`
        ${h1(`Senha alterada`)}
        ${p(`Olá, ${firstName}. A senha da sua conta foi alterada em ${strong(now)} (horário de Brasília).`)}
        ${p(`Se foi você, nenhuma ação é necessária.`)}
        ${p(`Se você ${strong('não reconhece essa ação')}, entre em contato imediatamente.`)}
        ${btn('Contatar suporte →', 'mailto:contato@vitaview.ai')}
        ${hr()}
        ${small(`<a href="mailto:contato@vitaview.ai" style="color:#444;">contato@vitaview.ai</a>`)}
    `);

    return sendEmail({
        to: email,
        subject: `Senha alterada · VitaView AI`,
        html,
        text: `Sua senha foi alterada em ${now}.\n\nSe não foi você, contate contato@vitaview.ai imediatamente.`,
    });
};

// ─── Payment confirmation (new subscription) ──────────────────────────────────

export const sendPaymentConfirmationEmail = async (
    email: string,
    fullName: string,
    planName: string,
    amountCents: number,
    periodEnd: Date,
): Promise<boolean> => {
    const firstName = fullName.split(' ')[0];
    const amount = (amountCents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const renewDate = periodEnd.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

    const html = em(`
        ${h1(`Pagamento confirmado`)}
        ${p(`Olá, ${firstName}. Seu pagamento foi processado com sucesso e seu plano está ativo.`)}
        ${infoBox([
            ['Plano', planName],
            ['Valor', amount],
            ['Próxima renovação', renewDate],
        ])}
        ${btn('Acessar VitaView AI →', BASE_URL())}
        ${hr()}
        ${small(`Dúvidas sobre a cobrança? <a href="mailto:contato@vitaview.ai" style="color:#444;">contato@vitaview.ai</a>`)}
    `);

    return sendEmail({
        to: email,
        subject: `Pagamento confirmado · VitaView AI`,
        html,
        text: `Pagamento confirmado!\n\nPlano: ${planName}\nValor: ${amount}\nPróxima renovação: ${renewDate}\n\nAcesse: ${BASE_URL()}`,
    });
};

// ─── Subscription renewal ─────────────────────────────────────────────────────

export const sendSubscriptionRenewalEmail = async (
    email: string,
    fullName: string,
    planName: string,
    amountCents: number,
    periodEnd: Date,
): Promise<boolean> => {
    const firstName = fullName.split(' ')[0];
    const amount = (amountCents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const renewDate = periodEnd.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

    const html = em(`
        ${h1(`Assinatura renovada`)}
        ${p(`Olá, ${firstName}. Sua assinatura foi renovada automaticamente.`)}
        ${infoBox([
            ['Plano', planName],
            ['Valor cobrado', amount],
            ['Ativa até', renewDate],
        ])}
        ${btn('Acessar VitaView AI →', BASE_URL())}
        ${hr()}
        ${small(`Para gerenciar sua assinatura, acesse as configurações da conta. Dúvidas: <a href="mailto:contato@vitaview.ai" style="color:#444;">contato@vitaview.ai</a>`)}
    `);

    return sendEmail({
        to: email,
        subject: `Assinatura renovada · VitaView AI`,
        html,
        text: `Sua assinatura foi renovada.\n\nPlano: ${planName}\nValor: ${amount}\nAtiva até: ${renewDate}`,
    });
};

// ─── Payment failed ───────────────────────────────────────────────────────────

export const sendPaymentFailedEmail = async (
    email: string,
    fullName: string,
    planName: string,
    nextRetryDate?: Date,
): Promise<boolean> => {
    const firstName = fullName.split(' ')[0];
    const retryText = nextRetryDate
        ? `Faremos uma nova tentativa em ${strong(nextRetryDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' }))}.`
        : `Por favor, atualize seu método de pagamento para evitar a suspensão do serviço.`;

    const html = em(`
        ${h1(`Falha no pagamento`)}
        ${p(`Olá, ${firstName}. Não conseguimos processar o pagamento da sua assinatura ${strong(planName)}.`)}
        ${p(retryText)}
        ${p(`Para evitar a interrupção do acesso, atualize suas informações de pagamento.`)}
        ${btn('Atualizar pagamento →', `${BASE_URL()}/assinatura`)}
        ${hr()}
        ${small(`Precisa de ajuda? <a href="mailto:contato@vitaview.ai" style="color:#444;">contato@vitaview.ai</a>`)}
    `);

    return sendEmail({
        to: email,
        subject: `Falha no pagamento · VitaView AI`,
        html,
        text: `Não conseguimos processar o pagamento do plano ${planName}.\n\nAtualize seu pagamento em: ${BASE_URL()}/assinatura`,
    });
};

// ─── Subscription cancelled ───────────────────────────────────────────────────

export const sendSubscriptionCancelledEmail = async (
    email: string,
    fullName: string,
    planName: string,
    accessUntil: Date,
): Promise<boolean> => {
    const firstName = fullName.split(' ')[0];
    const until = accessUntil.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

    const html = em(`
        ${h1(`Assinatura cancelada`)}
        ${p(`Olá, ${firstName}. Sua assinatura ${strong(planName)} foi cancelada.`)}
        ${p(`Você mantém acesso a todos os recursos até ${strong(until)}. Após essa data, sua conta será convertida para o plano gratuito.`)}
        ${p(`Se mudar de ideia, reative sua assinatura a qualquer momento.`)}
        ${btn('Reativar assinatura →', `${BASE_URL()}/assinatura`)}
        ${hr()}
        ${small(`Lamentamos vê-lo partir. Dúvidas: <a href="mailto:contato@vitaview.ai" style="color:#444;">contato@vitaview.ai</a>`)}
    `);

    return sendEmail({
        to: email,
        subject: `Assinatura cancelada · VitaView AI`,
        html,
        text: `Sua assinatura ${planName} foi cancelada.\n\nAcesso mantido até: ${until}\n\nReative em: ${BASE_URL()}/assinatura`,
    });
};
