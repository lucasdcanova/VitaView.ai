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
