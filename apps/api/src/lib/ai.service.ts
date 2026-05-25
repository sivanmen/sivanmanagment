/**
 * AI client wrapper — currently Anthropic (Claude). Designed to be
 * provider-agnostic so OpenAI/Google can be added later.
 *
 * Graceful degradation: if no provider key is configured, calls return a
 * structured "skipped" result instead of throwing — callers can present
 * a friendly "AI is not configured yet" message in the UI.
 */

import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config';

export type AiProvider = 'anthropic' | 'openai' | 'google';

export interface AiChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AiCompleteInput {
  messages: AiChatMessage[];
  /** Optional system prompt. */
  system?: string;
  /** Override the default provider. */
  provider?: AiProvider;
  /** Override the model. Default depends on provider. */
  model?: string;
  /** Max tokens to generate. */
  maxTokens?: number;
  /** Sampling temperature. */
  temperature?: number;
}

export interface AiCompleteResult {
  ok: boolean;
  /** True when integration is not configured. */
  skipped?: boolean;
  /** Generated assistant text. */
  text?: string;
  /** Provider used. */
  provider?: AiProvider;
  /** Model used. */
  model?: string;
  /** Token accounting. */
  usage?: { input: number; output: number };
  /** Error message when ok is false. */
  error?: string;
}

const DEFAULT_MODELS: Record<AiProvider, string> = {
  anthropic: 'claude-sonnet-4-20250514',
  openai: 'gpt-4o',
  google: 'gemini-1.5-pro',
};

class AiClient {
  private anthropic: Anthropic | null = null;

  isConfigured(provider: AiProvider = config.ai.defaultProvider): boolean {
    switch (provider) {
      case 'anthropic':
        return Boolean(config.ai.anthropicKey);
      case 'openai':
        return Boolean(config.ai.openaiKey);
      case 'google':
        return Boolean(config.ai.googleKey);
    }
  }

  /**
   * Generate a completion. Never throws — returns a structured result so
   * callers can degrade gracefully if the AI integration is offline.
   */
  async complete(input: AiCompleteInput): Promise<AiCompleteResult> {
    const provider = input.provider ?? config.ai.defaultProvider;
    if (!this.isConfigured(provider)) {
      return {
        ok: false,
        skipped: true,
        provider,
        error: `AI provider "${provider}" not configured`,
      };
    }

    if (provider !== 'anthropic') {
      // OpenAI / Google not yet wired — return skipped so the UI knows.
      return {
        ok: false,
        skipped: true,
        provider,
        error: `Provider "${provider}" wired in config but not yet implemented in client`,
      };
    }

    if (!this.anthropic) {
      this.anthropic = new Anthropic({ apiKey: config.ai.anthropicKey });
    }

    const model = input.model || DEFAULT_MODELS.anthropic;
    const maxTokens = input.maxTokens ?? 1024;

    try {
      const response = await this.anthropic.messages.create({
        model,
        max_tokens: maxTokens,
        temperature: input.temperature ?? 0.7,
        system: input.system,
        messages: input.messages.map((m) => ({ role: m.role, content: m.content })),
      });

      const textBlocks = response.content.filter((b: any) => b.type === 'text');
      const text = textBlocks.map((b: any) => b.text).join('\n');

      return {
        ok: true,
        provider,
        model,
        text,
        usage: {
          input: response.usage.input_tokens,
          output: response.usage.output_tokens,
        },
      };
    } catch (err: any) {
      const message = err?.message || 'Unknown AI error';
      console.error(`[AI:${provider}] complete FAIL → ${message}`);
      return { ok: false, provider, model, error: message };
    }
  }

  /**
   * One-shot helper for simple "answer this question" calls.
   */
  async ask(prompt: string, opts?: { system?: string; provider?: AiProvider }): Promise<AiCompleteResult> {
    return this.complete({
      messages: [{ role: 'user', content: prompt }],
      system: opts?.system,
      provider: opts?.provider,
    });
  }
}

export const aiClient = new AiClient();
