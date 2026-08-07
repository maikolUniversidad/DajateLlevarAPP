import type { LLMProvider } from '@dejatellevar/core';
import { z } from 'zod';

/**
 * Adaptador del puerto `LLMProvider` (definido en `packages/core`).
 *
 * Punto ÚNICO de consumo para todas las integraciones con IA del sistema.
 * Habla el protocolo OpenAI-compatible (`POST {baseUrl}/chat/completions`), que
 * exponen tanto OpenAI como DeepSeek, así que no arrastra ningún SDK de proveedor:
 * respeta la regla de oro de portabilidad (solo TypeScript, Zod y `fetch`).
 *
 * La lógica de negocio NUNCA llama a un proveedor directamente: pide un
 * `LLMProvider` por inyección. Así la misma integración sirve en web y móvil a
 * través de la API, y cambiar de proveedor es cuestión de configuración.
 */

export const AI_PROVIDERS = ['deepseek', 'openai'] as const;
export type AiProviderName = (typeof AI_PROVIDERS)[number];

/** Configuración de IA validada con Zod. Subconjunto autónomo de las env vars. */
const aiEnvSchema = z.object({
  AI_DEFAULT_PROVIDER: z.enum(AI_PROVIDERS).default('deepseek'),
  DEEPSEEK_API_KEY: z.string().optional(),
  DEEPSEEK_BASE_URL: z.string().url().default('https://api.deepseek.com'),
  DEEPSEEK_MODEL: z.string().default('deepseek-chat'),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_BASE_URL: z.string().url().default('https://api.openai.com/v1'),
  OPENAI_MODEL: z.string().default('gpt-4o-mini'),
  AI_REQUEST_TIMEOUT_MS: z.coerce.number().int().positive().default(60_000),
});

export type AiEnv = z.infer<typeof aiEnvSchema>;

interface ResolvedProvider {
  name: AiProviderName;
  apiKey: string;
  baseUrl: string;
  model: string;
}

export interface CreateLLMProviderOptions {
  /** Proveedor a usar. Por defecto, `AI_DEFAULT_PROVIDER`. */
  provider?: AiProviderName;
  /** Sobrescribe el modelo por defecto del proveedor. */
  model?: string;
  /** Fuente de variables de entorno. Por defecto, `process.env`. */
  env?: NodeJS.ProcessEnv;
}

function resolveProvider(
  cfg: AiEnv,
  name: AiProviderName,
  modelOverride?: string,
): ResolvedProvider {
  if (name === 'deepseek') {
    if (!cfg.DEEPSEEK_API_KEY) {
      throw new Error('Falta DEEPSEEK_API_KEY para usar el proveedor de IA "deepseek".');
    }
    return {
      name,
      apiKey: cfg.DEEPSEEK_API_KEY,
      baseUrl: cfg.DEEPSEEK_BASE_URL.replace(/\/+$/, ''),
      model: modelOverride ?? cfg.DEEPSEEK_MODEL,
    };
  }
  if (!cfg.OPENAI_API_KEY) {
    throw new Error('Falta OPENAI_API_KEY para usar el proveedor de IA "openai".');
  }
  return {
    name,
    apiKey: cfg.OPENAI_API_KEY,
    baseUrl: cfg.OPENAI_BASE_URL.replace(/\/+$/, ''),
    model: modelOverride ?? cfg.OPENAI_MODEL,
  };
}

interface ChatCompletionResponse {
  choices?: Array<{ message?: { content?: string | null } }>;
  usage?: { prompt_tokens?: number; completion_tokens?: number };
}

/**
 * Crea un `LLMProvider` listo para inyectar en casos de uso / rutas de la API.
 *
 * @example
 * const llm = createLLMProvider();               // usa AI_DEFAULT_PROVIDER
 * const llm = createLLMProvider({ provider: 'openai' });
 */
export function createLLMProvider(options: CreateLLMProviderOptions = {}): LLMProvider {
  const cfg = aiEnvSchema.parse(options.env ?? process.env);
  const providerName = options.provider ?? cfg.AI_DEFAULT_PROVIDER;
  const provider = resolveProvider(cfg, providerName, options.model);

  return {
    async generate(input) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), cfg.AI_REQUEST_TIMEOUT_MS);
      try {
        const res = await fetch(`${provider.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            authorization: `Bearer ${provider.apiKey}`,
          },
          signal: controller.signal,
          body: JSON.stringify({
            model: provider.model,
            temperature: 0.2,
            response_format: { type: 'json_object' },
            messages: [
              {
                role: 'system',
                content:
                  'Eres un componente del backend de DéjateLlevar. Devuelve EXCLUSIVAMENTE un objeto JSON válido que cumpla el esquema pedido. Nada de texto adicional, explicaciones ni bloques de código markdown.',
              },
              {
                role: 'user',
                content: `Caso de uso: ${input.useCase}\n\n${input.prompt}`,
              },
            ],
          }),
        });

        if (!res.ok) {
          const detail = await res.text().catch(() => '');
          throw new Error(
            `El proveedor de IA "${provider.name}" respondió ${res.status} ${res.statusText}: ${detail.slice(0, 500)}`,
          );
        }

        const data = (await res.json()) as ChatCompletionResponse;
        const content = data.choices?.[0]?.message?.content;
        if (!content) {
          throw new Error(`El proveedor de IA "${provider.name}" no devolvió contenido.`);
        }

        let raw: unknown;
        try {
          raw = JSON.parse(content);
        } catch {
          throw new Error(
            `El proveedor de IA "${provider.name}" no devolvió JSON válido: ${content.slice(0, 500)}`,
          );
        }

        return {
          value: input.schema.parse(raw),
          tokensInput: data.usage?.prompt_tokens ?? 0,
          tokensOutput: data.usage?.completion_tokens ?? 0,
          model: provider.model,
        };
      } finally {
        clearTimeout(timeout);
      }
    },
  };
}

export { createContentAnalyzer } from './content-analyzer.js';

let cached: LLMProvider | null = null;

/**
 * Instancia por defecto (perezosa y memoizada) para el consumo habitual.
 * Úsala en la API cuando no necesites elegir proveedor por petición.
 */
export function getLLMProvider(): LLMProvider {
  if (!cached) cached = createLLMProvider();
  return cached;
}
