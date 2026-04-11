import nodemailer, { Transporter } from 'nodemailer';

export interface EmailChannelConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
  fromName: string;
}

export interface SendMailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content?: string | Buffer;
    path?: string;
    contentType?: string;
  }>;
}

export class EmailService {
  private createTransporter(config: EmailChannelConfig): Transporter {
    return nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.pass,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  async sendMail(config: EmailChannelConfig, options: SendMailOptions): Promise<{ messageId: string; accepted: string[] }> {
    const transporter = this.createTransporter(config);

    const mailOptions = {
      from: `"${config.fromName}" <${config.from}>`,
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ''),
      replyTo: options.replyTo,
      attachments: options.attachments,
    };

    const result = await transporter.sendMail(mailOptions);

    return {
      messageId: result.messageId,
      accepted: result.accepted as string[],
    };
  }

  async testConnection(config: EmailChannelConfig): Promise<{ success: boolean; error?: string }> {
    try {
      const transporter = this.createTransporter(config);
      await transporter.verify();
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to connect to SMTP server',
      };
    }
  }
}

export const emailService = new EmailService();
