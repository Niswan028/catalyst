// Server-side email dispatcher using Nodemailer (SMTP / Resend compatible)
import nodemailer, { Transporter } from 'nodemailer';

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  mocked?: boolean;
}

let transporterInstance: Transporter | null = null;

export function getEmailTransporter(): Transporter {
  if (transporterInstance) {
    return transporterInstance;
  }

  const host = process.env.SMTP_HOST || process.env.RESEND_SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER || process.env.RESEND_SMTP_USER || (process.env.RESEND_API_KEY ? 'resend' : undefined);
  const pass = process.env.SMTP_PASS || process.env.RESEND_API_KEY;

  if (host && user && pass) {
    transporterInstance = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  } else {
    // Development fallback: mock/json transport
    transporterInstance = nodemailer.createTransport({
      jsonTransport: true,
    });
  }

  return transporterInstance;
}

/**
 * Send an email using server-side credentials
 */
export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  const from = process.env.EMAIL_FROM || 'CareConnect <reminders@careconnect.local>';
  const to = Array.isArray(options.to) ? options.to.join(', ') : options.to;

  const transporter = getEmailTransporter();

  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]+>/g, ' '),
      replyTo: options.replyTo,
    });

    const isMock = !process.env.SMTP_HOST && !process.env.RESEND_API_KEY;

    if (isMock) {
      console.log(`[Email Service - Dev Mock] Sent email to: ${to} | Subject: "${options.subject}"`);
    }

    return {
      success: true,
      messageId: info.messageId,
      mocked: isMock,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to send email';
    console.error('Email sending error:', error);
    return {
      success: false,
      error: message,
    };
  }
}
