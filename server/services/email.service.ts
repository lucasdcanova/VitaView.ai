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
    // In production, use real SMTP settings
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

    // In development, use console logging instead
    logger.info('[Email] SMTP not configured - emails will be logged to console');
    return null;
};

const transporter = createTransporter();

export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
    const from = process.env.EMAIL_FROM || 'VitaView AI <noreply@vitaview.ai>';

    if (!transporter) {
        // Log email to console in development
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

// Clinic invitation email template
export const sendClinicInvitationEmail = async (
    email: string,
    clinicName: string,
    inviteToken: string,
    invitedByName: string
): Promise<boolean> => {
    const baseUrl = process.env.APP_URL || 'http://localhost:3000';
    const inviteUrl = `${baseUrl}/accept-invitation/${inviteToken}`;

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Convite para ${clinicName}</title>
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4;">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <tr>
          <td style="background-color: #212121; padding: 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px;">VitaView AI</h1>
          </td>
        </tr>
        <tr>
          <td style="padding: 40px 30px;">
            <h2 style="color: #212121; margin: 0 0 20px 0;">Você foi convidado!</h2>
            <p style="color: #666666; font-size: 16px; line-height: 24px; margin: 0 0 20px 0;">
              <strong>${invitedByName}</strong> convidou você para fazer parte da equipe de <strong>${clinicName}</strong> no VitaView AI.
            </p>
            <p style="color: #666666; font-size: 16px; line-height: 24px; margin: 0 0 30px 0;">
              Como membro da clínica, você terá acesso a recursos compartilhados para gerenciar pacientes e exames.
            </p>
            <table cellpadding="0" cellspacing="0" style="margin: 0 auto;">
              <tr>
                <td style="background-color: #212121; border-radius: 8px;">
                  <a href="${inviteUrl}" style="display: inline-block; padding: 16px 32px; color: #ffffff; text-decoration: none; font-weight: bold; font-size: 16px;">
                    Aceitar Convite
                  </a>
                </td>
              </tr>
            </table>
            <p style="color: #999999; font-size: 14px; margin: 30px 0 0 0; text-align: center;">
              Este convite expira em 7 dias.
            </p>
          </td>
        </tr>
        <tr>
          <td style="background-color: #f4f4f4; padding: 20px; text-align: center;">
            <p style="color: #999999; font-size: 12px; margin: 0;">
              Se você não solicitou este convite, ignore este email.
            </p>
            <p style="color: #999999; font-size: 12px; margin: 10px 0 0 0;">
              © 2025 VitaView AI. Todos os direitos reservados.
            </p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

    const text = `
Você foi convidado para ${clinicName}!

${invitedByName} convidou você para fazer parte da equipe de ${clinicName} no VitaView AI.

Para aceitar o convite, acesse: ${inviteUrl}

Este convite expira em 7 dias.

Se você não solicitou este convite, ignore este email.
  `;

    return sendEmail({
        to: email,
        subject: `Convite para ${clinicName} - VitaView AI`,
        html,
        text,
    });
};

// Welcome email on registration
export const sendWelcomeEmail = async (
    email: string,
    fullName: string
): Promise<boolean> => {
    const firstName = fullName.split(' ')[0];
    const baseUrl = process.env.APP_URL || 'http://localhost:3000';

    const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4;">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <tr>
          <td style="background-color: #212121; padding: 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px;">VitaView AI</h1>
          </td>
        </tr>
        <tr>
          <td style="padding: 40px 30px;">
            <h2 style="color: #212121; margin: 0 0 20px 0;">Bem-vindo, ${firstName}!</h2>
            <p style="color: #666666; font-size: 16px; line-height: 24px; margin: 0 0 20px 0;">
              Sua conta no VitaView AI foi criada com sucesso. Agora você tem acesso a uma plataforma completa para gestão de pacientes e prontuários médicos com inteligência artificial.
            </p>
            <table cellpadding="0" cellspacing="0" style="margin: 0 auto;">
              <tr>
                <td style="background-color: #212121; border-radius: 8px;">
                  <a href="${baseUrl}" style="display: inline-block; padding: 16px 32px; color: #ffffff; text-decoration: none; font-weight: bold; font-size: 16px;">
                    Acessar VitaView AI
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="background-color: #f4f4f4; padding: 20px; text-align: center;">
            <p style="color: #999999; font-size: 12px; margin: 0;">© 2025 VitaView AI. Todos os direitos reservados.</p>
          </td>
        </tr>
      </table>
    </body>
    </html>`;

    return sendEmail({
        to: email,
        subject: `Bem-vindo ao VitaView AI, ${firstName}!`,
        html,
        text: `Bem-vindo ao VitaView AI, ${firstName}! Sua conta foi criada com sucesso. Acesse: ${baseUrl}`,
    });
};

// Password reset email
export const sendPasswordResetEmail = async (
    email: string,
    fullName: string,
    resetToken: string
): Promise<boolean> => {
    const firstName = fullName.split(' ')[0];
    const baseUrl = process.env.APP_URL || 'http://localhost:3000';
    const resetUrl = `${baseUrl}/reset-password/${resetToken}`;

    const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4;">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <tr>
          <td style="background-color: #212121; padding: 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px;">VitaView AI</h1>
          </td>
        </tr>
        <tr>
          <td style="padding: 40px 30px;">
            <h2 style="color: #212121; margin: 0 0 20px 0;">Redefinição de senha</h2>
            <p style="color: #666666; font-size: 16px; line-height: 24px; margin: 0 0 20px 0;">
              Olá, ${firstName}. Recebemos uma solicitação para redefinir a senha da sua conta.
            </p>
            <p style="color: #666666; font-size: 16px; line-height: 24px; margin: 0 0 30px 0;">
              Clique no botão abaixo para criar uma nova senha. Este link expira em <strong>1 hora</strong>.
            </p>
            <table cellpadding="0" cellspacing="0" style="margin: 0 auto;">
              <tr>
                <td style="background-color: #212121; border-radius: 8px;">
                  <a href="${resetUrl}" style="display: inline-block; padding: 16px 32px; color: #ffffff; text-decoration: none; font-weight: bold; font-size: 16px;">
                    Redefinir Senha
                  </a>
                </td>
              </tr>
            </table>
            <p style="color: #999999; font-size: 14px; margin: 30px 0 0 0; text-align: center;">
              Se você não solicitou a redefinição, ignore este email. Sua senha permanece a mesma.
            </p>
          </td>
        </tr>
        <tr>
          <td style="background-color: #f4f4f4; padding: 20px; text-align: center;">
            <p style="color: #999999; font-size: 12px; margin: 0;">© 2025 VitaView AI. Todos os direitos reservados.</p>
          </td>
        </tr>
      </table>
    </body>
    </html>`;

    return sendEmail({
        to: email,
        subject: 'Redefinição de senha - VitaView AI',
        html,
        text: `Olá ${firstName}, acesse o link para redefinir sua senha: ${resetUrl}\n\nEste link expira em 1 hora. Se não foi você, ignore este email.`,
    });
};

// Security alert on password change
export const sendPasswordChangedEmail = async (
    email: string,
    fullName: string
): Promise<boolean> => {
    const firstName = fullName.split(' ')[0];
    const now = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });

    const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4;">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <tr>
          <td style="background-color: #212121; padding: 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px;">VitaView AI</h1>
          </td>
        </tr>
        <tr>
          <td style="padding: 40px 30px;">
            <h2 style="color: #212121; margin: 0 0 20px 0;">Sua senha foi alterada</h2>
            <p style="color: #666666; font-size: 16px; line-height: 24px; margin: 0 0 20px 0;">
              Olá, ${firstName}. A senha da sua conta VitaView AI foi alterada em <strong>${now}</strong>.
            </p>
            <p style="color: #666666; font-size: 16px; line-height: 24px; margin: 0 0 20px 0;">
              Se foi você, pode ignorar este email. Se não reconhece esta ação, entre em contato imediatamente pelo email <a href="mailto:contato@vitaview.ai" style="color: #212121;">contato@vitaview.ai</a>.
            </p>
          </td>
        </tr>
        <tr>
          <td style="background-color: #f4f4f4; padding: 20px; text-align: center;">
            <p style="color: #999999; font-size: 12px; margin: 0;">© 2025 VitaView AI. Todos os direitos reservados.</p>
          </td>
        </tr>
      </table>
    </body>
    </html>`;

    return sendEmail({
        to: email,
        subject: 'Senha alterada - VitaView AI',
        html,
        text: `Olá ${firstName}, sua senha foi alterada em ${now}. Se não foi você, contate contato@vitaview.ai imediatamente.`,
    });
};
