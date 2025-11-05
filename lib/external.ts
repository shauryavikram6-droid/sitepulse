import { isMocked, OPENAI_API_KEY, WHATSAPP_TOKEN, SMTP_URL } from './env';

type MessagePayload = { to?: string; subject?: string; body?: string; templateKey?: string; meta?: Record<string, unknown> };

type TranscriptionInput = { audioNoteId: string; filePath: string };

type WhatsAppPayload = { to: string; message: string };

type EmailPayload = { to: string; subject: string; html: string };

export async function transcribeAudioStub(input: TranscriptionInput) {
  if (isMocked(OPENAI_API_KEY)) {
    console.log('[MOCK] Transcribe audio', input);
    return 'Stub transcription generated without OPENAI_API_KEY.';
  }
  console.log('[STUB] Transcribe audio via OpenAI', input);
  return 'Stub transcription generated via OpenAI integration.';
}

export async function sendWhatsAppMessage(payload: WhatsAppPayload) {
  if (isMocked(WHATSAPP_TOKEN)) {
    console.log('[MOCK] WhatsApp send:', payload);
    return { mock: true };
  }
  console.log('[STUB] WhatsApp send with token', payload);
  return { mock: false };
}

export async function sendEmail(payload: EmailPayload) {
  if (isMocked(SMTP_URL)) {
    console.log('[MOCK] SMTP send:', payload);
    return { mock: true };
  }
  console.log('[STUB] SMTP send through provider', payload);
  return { mock: false };
}

export async function logMessage(payload: MessagePayload) {
  console.log('[MOCK] Generic message', payload);
}
