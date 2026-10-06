import axios from 'axios';
import nodemailer, { Transporter } from 'nodemailer';
import { LoggerUtils } from './loggerUtils';

type LinkEmail = {
    to: string;
    subject: string;
    firstName?: string;
    intro: string;
    buttonText: string;
    url: string;
    footer: string;
};

type Message = {
    to: string;
    subject: string;
    text: string;
    html: string;
};

const RESEND_URL = 'https://api.resend.com/emails';

function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

export class EmailUtils {
    private static transporter: Transporter | null = null;

    private static getTransporter(): Transporter {
        if (!this.transporter) {
            this.transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASSWORD,
                },
                connectionTimeout: 10_000,
                greetingTimeout: 10_000,
                socketTimeout: 15_000,
            });
        }
        return this.transporter;
    }

    private static async sendWithResend(message: Message): Promise<void> {
        await axios.post(
            RESEND_URL,
            {
                from: `LMS <${process.env.EMAIL_FROM}>`,
                to: [message.to],
                subject: message.subject,
                text: message.text,
                html: message.html,
            },
            {
                headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY ?? ''}` },
                timeout: 10_000,
            },
        );
    }

    private static async sendWithSmtp(message: Message): Promise<void> {
        await this.getTransporter().sendMail({
            from: `"LMS" <${process.env.SMTP_USER}>`,
            to: message.to,
            subject: message.subject,
            text: message.text,
            html: message.html,
        });
    }

    private static async deliver(message: Message): Promise<boolean> {
        if (process.env.RESEND_API_KEY) {
            try {
                await this.sendWithResend(message);
                return true;
            } catch (error: any) {
                LoggerUtils.warn(`Resend failed: ${message.subject}`, {
                    status: error.response?.status,
                    detail: error.response?.data ?? error.message,
                });
            }
        }

        if (process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
            try {
                await this.sendWithSmtp(message);
                return true;
            } catch (error: any) {
                LoggerUtils.warn(`SMTP failed: ${message.subject}`, { detail: error.message });
            }
        }

        LoggerUtils.error(`Could not send email: ${message.subject}`);
        return false;
    }

    private static sendLinkEmail(email: LinkEmail): Promise<boolean> {
        const name = email.firstName || 'there';

        return this.deliver({
            to: email.to,
            subject: email.subject,
            text: [`Hello ${name},`, '', email.intro, email.url, '', email.footer].join('\n'),
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>Hello ${escapeHtml(name)}!</h2>
                    <p>${email.intro}</p>
                    <p style="text-align: center; margin: 32px 0;">
                        <a href="${email.url}"
                           style="background-color: #111827; color: #ffffff; padding: 12px 24px;
                                  border-radius: 6px; text-decoration: none; display: inline-block;">
                            ${email.buttonText}
                        </a>
                    </p>
                    <p>Or paste this link into your browser:<br /><a href="${email.url}">${email.url}</a></p>
                    <p>${email.footer}</p>
                </div>
            `,
        });
    }

    static sendVerificationEmail(to: string, verifyUrl: string, firstName?: string): Promise<boolean> {
        return this.sendLinkEmail({
            to,
            firstName,
            subject: 'Confirm your email address',
            intro: 'Thanks for signing up. Click the button below to confirm your email address.',
            buttonText: 'Confirm my email',
            url: verifyUrl,
            footer: "The link works once and expires in 24 hours. If you didn't create an account, you can ignore this email.",
        });
    }

    static sendPasswordResetEmail(to: string, resetUrl: string, firstName?: string): Promise<boolean> {
        return this.sendLinkEmail({
            to,
            firstName,
            subject: 'Reset your password',
            intro: 'We received a request to reset your password. Click the button below to choose a new one.',
            buttonText: 'Reset my password',
            url: resetUrl,
            footer: "The link works once and expires in 1 hour. If you didn't ask for this, ignore this email: your password stays the same.",
        });
    }
}