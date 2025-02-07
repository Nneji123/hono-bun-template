import nodemailer from 'nodemailer';
import { promises as fs } from 'fs';
import path from 'path';
import renderTemplate from "../utils/renderTemplate";
import { Resend } from 'resend';

// @ts-ignore
import { SendMailClient } from 'zeptomail';

interface Attachment {
  filepath: string;
  filename: string;
}

interface EmailService {
  sendEmail(
    subject: string,
    templatePath: string,
    toEmail: string | string[],
    context: Record<string, any>,
    attachments?: Attachment[]
  ): Promise<void>;
}

abstract class EmailInterface implements EmailService {
  abstract sendEmail(
    subject: string,
    templatePath: string,
    toEmail: string | string[],
    context: Record<string, any>,
    attachments?: Attachment[]
  ): Promise<void>;

  async prepareAttachments(attachments?: Attachment[]) {
    if (!attachments || attachments.length === 0) return undefined;

    return Promise.all(
      attachments.map(async (attachment) => {
        const content = await fs.readFile(attachment.filepath);
        return {
          filename: attachment.filename,
          content: content,
        };
      })
    );
  }
}

// SMTP Email Service
class SmtpEmailService extends EmailInterface {
  async sendEmail(
    subject: string,
    templatePath: string,
    toEmail: string | string[],
    context: Record<string, any>,
    attachments?: Attachment[]
  ) {
    try {
      const { html, text } = await renderTemplate(templatePath, context);
      const preparedAttachments = await this.prepareAttachments(attachments);

      const transporter = nodemailer.createTransport({
        host: Bun.env.SMTP_HOST,
        port: parseInt(Bun.env.SMTP_PORT || '465'),
        secure: Bun.env.SMTP_PORT === '465',
        auth: {
          user: Bun.env.SMTP_USER,
          pass: Bun.env.SMTP_PASSWORD,
        },
        tls: {
          rejectUnauthorized: false,
        },
      });

      await transporter.sendMail({
        from: `"${Bun.env.SMTP_FROM_NAME}" <${Bun.env.SMTP_USER}>`,
        to: Array.isArray(toEmail) ? toEmail.join(', ') : toEmail,
        replyTo: Bun.env.SMTP_USER,
        subject,
        html,
        text,
        attachments: preparedAttachments?.map((att) => ({
          filename: att.filename,
          content: att.content,
        })),
      });

      console.log(`Email sent to ${toEmail} via SMTP`);
    } catch (error) {
      console.error('Error sending email via SMTP:', error);
      throw error;
    }
  }
}

// ZeptoMail Service
class ZeptoMailService extends EmailInterface {
  private client: SendMailClient;

  constructor() {
    super();
    if (!Bun.env.ZEPTOMAIL_API_KEY || !Bun.env.ZEPTOMAIL_EMAIL_ADDRESS) {
      throw new Error('Missing ZeptoMail environment variables');
    }

    this.client = new SendMailClient({
      url: 'api.zeptomail.com/',
      token: `Zoho-enczapikey ${Bun.env.ZEPTOMAIL_API_KEY}`,
    });
  }

  async sendEmail(
    subject: string,
    templatePath: string,
    toEmail: string | string[],
    context: Record<string, any>,
    attachments?: Attachment[]
  ) {
    try {
      const { html, text } = await renderTemplate(templatePath, context);
      const preparedAttachments = await this.prepareAttachments(attachments);

      const recipients = (Array.isArray(toEmail) ? toEmail : [toEmail]).map(
        (email) => ({ email_address: { address: email } })
      );

      const payload: any = {
        from: {
          address: Bun.env.ZEPTOMAIL_EMAIL_ADDRESS,
          name: Bun.env.ZEPTOMAIL_EMAIL_NAME,
        },
        to: recipients,
        subject,
        htmlbody: html,
        textbody: text,
      };

      if (preparedAttachments?.length) {
        payload.attachments = preparedAttachments.map((att) => ({
          name: att.filename,
          content: att.content.toString('base64'),
          mime_type: this.getMimeType(att.filename),
        }));
      }

      await this.client.sendMail(payload);
      console.log(`Email sent to ${toEmail} via ZeptoMail`);
    } catch (error) {
      console.error('Error sending email via ZeptoMail:', error);
      throw error;
    }
  }

  private getMimeType(filename: string) {
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx':
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
    };
    return mimeTypes[ext] || 'application/octet-stream';
  }
}

// Resend Email Service
class ResendEmailService extends EmailInterface {
  private client: Resend;

  constructor() {
    super();
    if (!Bun.env.RESEND_API_KEY || !Bun.env.RESEND_FROM_EMAIL) {
      throw new Error('Missing Resend environment variables');
    }

    this.client = new Resend(Bun.env.RESEND_API_KEY);
  }

  async sendEmail(
    subject: string,
    templatePath: string,
    toEmail: string | string[],
    context: Record<string, any>,
    attachments?: Attachment[]
  ) {
    try {
      const { html, text } = await renderTemplate(templatePath, context);
      const preparedAttachments = await this.prepareAttachments(attachments);

      const payload: any = {
        from: `${Bun.env.RESEND_FROM_NAME} <${Bun.env.RESEND_FROM_EMAIL}>`,
        to: Array.isArray(toEmail) ? toEmail : [toEmail],
        subject,
        html,
        text,
      };

      if (preparedAttachments?.length) {
        payload.attachments = preparedAttachments.map((att) => ({
          filename: att.filename,
          content: att.content,
        }));
      }

      await this.client.emails.send(payload);
      console.log(`Email sent to ${toEmail} via Resend`);
    } catch (error) {
      console.error('Error sending email via Resend:', error);
      throw error;
    }
  }
}

// Dummy Email Service
class DummyEmailService extends EmailInterface {
  async sendEmail(
    subject: string,
    templatePath: string,
    toEmail: string | string[],
    context: Record<string, any>,
    attachments?: Attachment[]
  ) {
    console.log('=== DUMMY EMAIL SERVICE ===');
    console.log('To:', toEmail);
    console.log('Subject:', subject);
    console.log('Context:', JSON.stringify(context, null, 2));
    console.log('Attachments:', attachments?.length || 0);
    console.log('===========================');
  }
}

// Email Notification Service
export class EmailNotificationService {
  private emailService: EmailService;

  constructor() {
    switch (Bun.env.EMAIL_SERVICE_TYPE) {
      case 'smtp':
        this.emailService = new SmtpEmailService();
        break;
      case 'zeptomail':
        this.emailService = new ZeptoMailService();
        break;
      case 'resend':
        this.emailService = new ResendEmailService();
        break;
      case 'dummy':
        this.emailService = new DummyEmailService();
        break;
      default:
        throw new Error('Unsupported email service type');
    }
  }

  async sendEmail(
    subject: string,
    templatePath: string,
    toEmail: string | string[],
    context: Record<string, any>,
    attachments?: Attachment[]
  ) {
    return this.emailService.sendEmail(subject, templatePath, toEmail, context, attachments);
  }
}
