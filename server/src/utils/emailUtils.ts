import nodemailer, { Transporter } from 'nodemailer';
import { LoggerUtils } from './loggerUtils';

// Makes user-typed text safe to place inside HTML
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

    // Built on first use, so the .env values are read after dotenv has loaded them
    private static getTransporter(): Transporter {
        if (!this.transporter) {
            this.transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASSWORD,
                },
            });
        }
        return this.transporter;
    }

    static async sendVerificationEmail(to: string, verifyUrl: string, firstName?: string): Promise<boolean> {
        const name = firstName || 'there';
        const safeName = escapeHtml(name);

        try {
            await this.getTransporter().sendMail({
                from: `"LMS" <${process.env.SMTP_USER}>`,
                to,
                subject: 'Confirm your email address',
                text: [
                    `Hello ${name},`,
                    '',
                    'Thanks for signing up. Open this link to confirm your email address:',
                    verifyUrl,
                    '',
                    "The link works once and expires in 24 hours. If you didn't create an account, ignore this email.",
                ].join('\n'),
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2>Hello ${safeName}!</h2>
                        <p>Thanks for signing up. Click the button below to confirm your email address.</p>
                        <p style="text-align: center; margin: 32px 0;">
                            <a href="${verifyUrl}"
                               style="background-color: #111827; color: #ffffff; padding: 12px 24px;
                                      border-radius: 6px; text-decoration: none; display: inline-block;">
                                Confirm my email
                            </a>
                        </p>
                        <p>Or paste this link into your browser:<br /><a href="${verifyUrl}">${verifyUrl}</a></p>
                        <p>The link works once and expires in 24 hours.
                           If you didn't create an account, you can ignore this email.</p>
                    </div>
                `,
            });
            return true;
        } catch (error) {
            LoggerUtils.error('Failed to send verification email', { error: String(error) });
            return false;
        }
    }
}