import type { TranscriptionProvider } from '@dejatellevar/core';
import { z } from 'zod';

/**
 * TranscriptionProvider REAL sobre Whisper de OpenAI (`/audio/transcriptions`).
 * Descarga el medio del `mediaUrl`, lo sube a Whisper y devuelve la transcripción
 * con idioma y duración. Usa la clave de OpenAI (no el proveedor por defecto).
 *
 * Degradación elegante: si un medio no se puede descargar/transcribir (URL caída,
 * demasiado grande, formato no soportado), devuelve texto vacío en vez de lanzar,
 * para que el análisis del creador continúe con las demás piezas y los captions.
 */

const whisperEnvSchema = z.object({
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_BASE_URL: z.string().url().default('https://api.openai.com/v1'),
  OPENAI_WHISPER_MODEL: z.string().default('whisper-1'),
  AI_TRANSCRIBE_TIMEOUT_MS: z.coerce.number().int().positive().default(120_000),
});

// Whisper admite hasta 25 MB por archivo; dejamos margen.
const MAX_BYTES = 24 * 1024 * 1024;

const EXT_BY_MIME: Record<string, string> = {
  'audio/mpeg': 'mp3',
  'audio/mp4': 'm4a',
  'audio/wav': 'wav',
  'audio/webm': 'webm',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/quicktime': 'mov',
};

export interface CreateWhisperTranscriberOptions {
  env?: NodeJS.ProcessEnv;
}

interface WhisperVerboseResponse {
  text?: string;
  language?: string;
  duration?: number;
}

export function createWhisperTranscriber(
  options: CreateWhisperTranscriberOptions = {},
): TranscriptionProvider {
  const cfg = whisperEnvSchema.parse(options.env ?? process.env);
  if (!cfg.OPENAI_API_KEY) {
    throw new Error('Falta OPENAI_API_KEY para transcribir con Whisper.');
  }
  const baseUrl = cfg.OPENAI_BASE_URL.replace(/\/+$/, '');
  const empty = { text: '', language: 'und', durationSeconds: null } as const;

  return {
    async transcribe({ mediaUrl }) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), cfg.AI_TRANSCRIBE_TIMEOUT_MS);
      try {
        // 1. Descarga el medio.
        const media = await fetch(mediaUrl, { signal: controller.signal });
        if (!media.ok) {
          console.warn(`[whisper] no se pudo descargar el medio (${media.status}): ${mediaUrl}`);
          return { ...empty };
        }
        const buf = new Uint8Array(await media.arrayBuffer());
        if (buf.byteLength === 0 || buf.byteLength > MAX_BYTES) {
          console.warn(`[whisper] medio omitido por tamaño (${buf.byteLength} bytes): ${mediaUrl}`);
          return { ...empty };
        }
        const mime = media.headers.get('content-type')?.split(';')[0]?.trim() ?? 'audio/mpeg';
        const ext = EXT_BY_MIME[mime] ?? 'mp4';

        // 2. Sube a Whisper como multipart.
        const form = new FormData();
        form.append('file', new Blob([buf], { type: mime }), `audio.${ext}`);
        form.append('model', cfg.OPENAI_WHISPER_MODEL);
        form.append('response_format', 'verbose_json');

        const res = await fetch(`${baseUrl}/audio/transcriptions`, {
          method: 'POST',
          headers: { authorization: `Bearer ${cfg.OPENAI_API_KEY}` },
          body: form,
          signal: controller.signal,
        });
        if (!res.ok) {
          const detail = await res.text().catch(() => '');
          console.warn(`[whisper] transcripción falló (${res.status}): ${detail.slice(0, 200)}`);
          return { ...empty };
        }

        const data = (await res.json()) as WhisperVerboseResponse;
        return {
          text: data.text ?? '',
          language: data.language ?? 'und',
          durationSeconds: typeof data.duration === 'number' ? Math.round(data.duration) : null,
        };
      } catch (e) {
        console.warn(`[whisper] error al transcribir ${mediaUrl}:`, (e as Error).message);
        return { ...empty };
      } finally {
        clearTimeout(timeout);
      }
    },
  };
}
