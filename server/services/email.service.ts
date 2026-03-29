import nodemailer from 'nodemailer';
import logger from '../logger';

interface EmailOptions {
    to: string;
    subject: string;
    html: string;
    text?: string;
}

// Create transporter based on environment
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
        logger.info(`[Email Mock] To: ${options.to}`);
        logger.info(`[Email Mock] Subject: ${options.subject}`);
        logger.info(`[Email Mock] Body: ${options.text || 'HTML content'}`);
        return true;
    }

    try {
        await transporter.sendMail({
            from,
            to: options.to,
            subject: options.subject,
            html: options.html,
            text: options.text,
        });

        logger.info(`[Email] Successfully sent to ${options.to}`);
        return true;
    } catch (error) {
        logger.error('[Email] Failed to send:', error);
        return false;
    }
};

// ─── Shared design system ────────────────────────────────────────────────────

const LOGO_SVG = `
  <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
    <tr>
      <td style="vertical-align:middle;padding-right:12px;">
        <div style="background:#ffffff;border-radius:6px;padding:7px;display:inline-block;line-height:0;">
          <img src="https://vitaview.ai/icon-192x192.png" width="34" height="34" alt="VitaView AI" style="display:block;border:0;">
        </div>
      </td>
      <td style="vertical-align:middle;">
        <span style="font-family:Georgia,'Times New Roman',serif;font-size:20px;font-weight:bold;color:#ffffff;letter-spacing:-0.3px;">VitaView</span><span style="font-family:Georgia,'Times New Roman',serif;font-size:12px;font-weight:bold;color:rgba(255,255,255,0.5);letter-spacing:0.5px;vertical-align:super;margin-left:2px;">AI</span>
      </td>
    </tr>
  </table>`;

function emailWrapper(content: string): string {
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>VitaView AI</title>
</head>
<body style="margin:0;padding:0;background-color:#f0f0ed;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f0ed;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;">

          <!-- HEADER -->
          <tr>
            <td style="background-color:#0f0f0f;padding:32px 40px;border-radius:4px 4px 0 0;">
              ${LOGO_SVG}
            </td>
          </tr>

          <!-- TEAL ACCENT LINE -->
          <tr>
            <td style="height:3px;background:linear-gradient(90deg,#448C9B 0%,#2d6b77 100%);font-size:0;line-height:0;">&nbsp;</td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="background-color:#ffffff;padding:48px 40px 40px 40px;">
              ${content}
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background-color:#f7f7f5;padding:24px 40px;border-top:1px solid #e8e8e5;border-radius:0 0 4px 4px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size:12px;color:#999;line-height:20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
                    © ${new Date().getFullYear()} VitaView AI · Todos os direitos reservados<br>
                    <a href="https://vitaview.ai" style="color:#999;text-decoration:none;">vitaview.ai</a>
                    &nbsp;·&nbsp;
                    <a href="mailto:contato@vitaview.ai" style="color:#999;text-decoration:none;">contato@vitaview.ai</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function ctaButton(label: string, url: string): string {
    return `
    <table cellpadding="0" cellspacing="0" style="margin:32px 0;">
      <tr>
        <td style="background-color:#0f0f0f;">
          <a href="${url}" style="display:inline-block;padding:14px 32px;color:#ffffff;text-decoration:none;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;font-weight:600;letter-spacing:0.3px;">${label}</a>
        </td>
      </tr>
    </table>`;
}

function divider(): string {
    return `<table width="100%" cellpadding="0" cellspacing="0" style="margin:32px 0 0 0;">
      <tr><td style="height:1px;background-color:#f0f0ed;font-size:0;line-height:0;">&nbsp;</td></tr>
    </table>`;
}

function heading(text: string): string {
    return `<h1 style="margin:0 0 16px 0;font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:normal;color:#0f0f0f;letter-spacing:-0.5px;line-height:1.3;">${text}</h1>`;
}

function body(text: string): string {
    return `<p style="margin:0 0 16px 0;font-size:15px;color:#555;line-height:1.7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">${text}</p>`;
}

function note(text: string): string {
    return `<p style="margin:24px 0 0 0;font-size:13px;color:#aaa;line-height:1.6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">${text}</p>`;
}

// ─── Clinic invitation ────────────────────────────────────────────────────────

export const sendClinicInvitationEmail = async (
    email: string,
    clinicName: string,
    inviteToken: string,
    invitedByName: string
): Promise<boolean> => {
    const baseUrl = process.env.APP_URL || 'http://localhost:3000';
    const inviteUrl = `${baseUrl}/accept-invitation/${inviteToken}`;

    const html = emailWrapper(`
        ${heading(`Você foi convidado para ${clinicName}`)}
        ${body(`<strong style="color:#0f0f0f;">${invitedByName}</strong> convidou você para fazer parte da equipe de <strong style="color:#0f0f0f;">${clinicName}</strong> no VitaView AI.`)}
        ${body(`Como membro da clínica, você terá acesso a recursos compartilhados para gestão de pacientes e prontuários com inteligência artificial.`)}
        ${ctaButton('Aceitar convite →', inviteUrl)}
        ${divider()}
        ${note(`Este convite expira em 7 dias. Se você não esperava receber este email, pode ignorá-lo com segurança.`)}
    `);

    const text = `${invitedByName} convidou você para ${clinicName} no VitaView AI.\n\nAcesse: ${inviteUrl}\n\nEste convite expira em 7 dias.`;

    return sendEmail({ to: email, subject: `Convite para ${clinicName} · VitaView AI`, html, text });
};

// ─── Welcome email ────────────────────────────────────────────────────────────

export const sendWelcomeEmail = async (
    email: string,
    fullName: string
): Promise<boolean> => {
    const firstName = fullName.split(' ')[0];
    const baseUrl = process.env.APP_URL || 'http://localhost:3000';

    const html = emailWrapper(`
        ${heading(`Bem-vindo, ${firstName}.`)}
        ${body(`Sua conta no VitaView AI está pronta. Você agora tem acesso a uma plataforma completa para gestão de pacientes, prontuários eletrônicos e análise clínica com inteligência artificial.`)}
        ${body(`Comece enviando exames, criando prontuários ou configurando sua clínica.`)}
        ${ctaButton('Acessar VitaView AI →', baseUrl)}
        ${divider()}
        ${note(`Dúvidas? Respondemos em <a href="mailto:contato@vitaview.ai" style="color:#aaa;">contato@vitaview.ai</a>`)}
    `);

    const text = `Bem-vindo ao VitaView AI, ${firstName}!\n\nSua conta está pronta. Acesse: ${baseUrl}`;

    return sendEmail({ to: email, subject: `Bem-vindo ao VitaView AI`, html, text });
};

// ─── Password reset ───────────────────────────────────────────────────────────

export const sendPasswordResetEmail = async (
    email: string,
    fullName: string,
    resetToken: string
): Promise<boolean> => {
    const firstName = fullName.split(' ')[0];
    const baseUrl = process.env.APP_URL || 'http://localhost:3000';
    const resetUrl = `${baseUrl}/reset-password/${resetToken}`;

    const html = emailWrapper(`
        ${heading(`Redefinição de senha`)}
        ${body(`Olá, ${firstName}. Recebemos uma solicitação para redefinir a senha da sua conta VitaView AI.`)}
        ${body(`Este link é válido por <strong style="color:#0f0f0f;">1 hora</strong>. Após esse período, você precisará solicitar um novo link.`)}
        ${ctaButton('Redefinir senha →', resetUrl)}
        ${divider()}
        ${note(`Se você não solicitou a redefinição, ignore este email. Sua senha permanece inalterada. Caso tenha dúvidas, entre em contato em <a href="mailto:contato@vitaview.ai" style="color:#aaa;">contato@vitaview.ai</a>`)}
    `);

    const text = `Olá ${firstName},\n\nAcesse o link para redefinir sua senha:\n${resetUrl}\n\nVálido por 1 hora. Se não foi você, ignore este email.`;

    return sendEmail({ to: email, subject: `Redefinição de senha · VitaView AI`, html, text });
};

// ─── Password changed alert ───────────────────────────────────────────────────

export const sendPasswordChangedEmail = async (
    email: string,
    fullName: string
): Promise<boolean> => {
    const firstName = fullName.split(' ')[0];
    const now = new Date().toLocaleString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });

    const html = emailWrapper(`
        ${heading(`Sua senha foi alterada`)}
        ${body(`Olá, ${firstName}. A senha da sua conta VitaView AI foi alterada em <strong style="color:#0f0f0f;">${now}</strong> (horário de Brasília).`)}
        ${body(`Se foi você quem realizou essa alteração, este email é apenas uma confirmação — nenhuma ação é necessária.`)}
        ${body(`Se você <strong style="color:#0f0f0f;">não reconhece essa ação</strong>, entre em contato imediatamente.`)}
        ${ctaButton('Contatar suporte →', 'mailto:contato@vitaview.ai')}
        ${divider()}
        ${note(`<a href="mailto:contato@vitaview.ai" style="color:#aaa;">contato@vitaview.ai</a>`)}
    `);

    const text = `Olá ${firstName},\n\nSua senha foi alterada em ${now}.\n\nSe não foi você, contate contato@vitaview.ai imediatamente.`;

    return sendEmail({ to: email, subject: `Senha alterada · VitaView AI`, html, text });
};
