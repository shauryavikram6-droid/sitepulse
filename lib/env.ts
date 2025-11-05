export const AUTH_SECRET = process.env.AUTH_SECRET || 'dev-secret';
if (!process.env.AUTH_SECRET) {
  process.env.AUTH_SECRET = AUTH_SECRET;
}

export const DATABASE_URL = process.env.DATABASE_URL || 'file:./dev.db';
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = DATABASE_URL;
}

export const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN || '';
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
export const SMTP_URL = process.env.SMTP_URL || '';

export function isMocked(value: string | undefined) {
  return !value;
}
