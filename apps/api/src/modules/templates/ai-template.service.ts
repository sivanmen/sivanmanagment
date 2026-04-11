import { prisma } from '../../prisma/client';
import { ApiError } from '../../utils/api-error';
import type { Locale } from './templates.service';
import { ALL_LOCALES } from './templates.service';

// ── Types ────────────────────────────────────────────────────────

interface AiProviderAdapter {
  generate(systemPrompt: string, userPrompt: string): Promise<string>;
}

interface ProviderRecord {
  id: string;
  provider: string;
  name: string;
  apiKey: string;
  model: string;
  isActive: boolean;
  isDefault: boolean;
  config: any;
}

const LOCALE_NAMES: Record<string, string> = {
  en: 'English',
  he: 'Hebrew',
  de: 'German',
  es: 'Spanish',
  fr: 'French',
  ru: 'Russian',
};

// ── Provider Adapters ────────────────────────────────────────────

function createAnthropicAdapter(apiKey: string, model: string, config?: any): AiProviderAdapter {
  return {
    async generate(systemPrompt: string, userPrompt: string): Promise<string> {
      const temperature = config?.temperature ?? 0.7;
      const maxTokens = config?.maxTokens ?? 4096;

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model,
          max_tokens: maxTokens,
          temperature,
          system: systemPrompt,
          messages: [{ role: 'user', content: userPrompt }],
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw ApiError.badRequest(`Anthropic API error: ${response.status} - ${error}`, 'AI_PROVIDER_ERROR');
      }

      const data: any = await response.json();
      return data.content?.[0]?.text || '';
    },
  };
}

function createOpenAIAdapter(apiKey: string, model: string, config?: any): AiProviderAdapter {
  return {
    async generate(systemPrompt: string, userPrompt: string): Promise<string> {
      const temperature = config?.temperature ?? 0.7;
      const maxTokens = config?.maxTokens ?? 4096;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          temperature,
          max_tokens: maxTokens,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw ApiError.badRequest(`OpenAI API error: ${response.status} - ${error}`, 'AI_PROVIDER_ERROR');
      }

      const data: any = await response.json();
      return data.choices?.[0]?.message?.content || '';
    },
  };
}

function createGoogleAdapter(apiKey: string, model: string, config?: any): AiProviderAdapter {
  return {
    async generate(systemPrompt: string, userPrompt: string): Promise<string> {
      const temperature = config?.temperature ?? 0.7;
      const maxOutputTokens = config?.maxTokens ?? 4096;

      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemPrompt }],
          },
          contents: [
            {
              role: 'user',
              parts: [{ text: userPrompt }],
            },
          ],
          generationConfig: {
            temperature,
            maxOutputTokens,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw ApiError.badRequest(`Google AI API error: ${response.status} - ${error}`, 'AI_PROVIDER_ERROR');
      }

      const data: any = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    },
  };
}

function getAdapter(provider: ProviderRecord): AiProviderAdapter {
  switch (provider.provider) {
    case 'ANTHROPIC':
      return createAnthropicAdapter(provider.apiKey, provider.model, provider.config);
    case 'OPENAI':
      return createOpenAIAdapter(provider.apiKey, provider.model, provider.config);
    case 'GOOGLE':
      return createGoogleAdapter(provider.apiKey, provider.model, provider.config);
    default:
      throw ApiError.badRequest(`Unsupported AI provider: ${provider.provider}`, 'UNSUPPORTED_PROVIDER');
  }
}

// ── AI Template Service ──────────────────────────────────────────

export class AiTemplateService {
  /**
   * Get the active AI provider, either by ID or the default.
   */
  private async getProvider(providerId?: string): Promise<ProviderRecord> {
    let provider;

    if (providerId) {
      provider = await prisma.aiProviderConfig.findUnique({ where: { id: providerId } });
      if (!provider) {
        throw ApiError.notFound('AiProviderConfig');
      }
      if (!provider.isActive) {
        throw ApiError.badRequest('AI provider is not active', 'PROVIDER_INACTIVE');
      }
    } else {
      // Find default active provider
      provider = await prisma.aiProviderConfig.findFirst({
        where: { isDefault: true, isActive: true },
      });

      if (!provider) {
        // Fallback to any active provider
        provider = await prisma.aiProviderConfig.findFirst({
          where: { isActive: true },
        });
      }
    }

    if (!provider) {
      throw ApiError.badRequest(
        'No active AI provider configured. Please add an AI provider in Settings.',
        'NO_AI_PROVIDER',
      );
    }

    return provider;
  }

  /**
   * Update the lastUsedAt timestamp for a provider.
   */
  private async markUsed(providerId: string) {
    await prisma.aiProviderConfig.update({
      where: { id: providerId },
      data: { lastUsedAt: new Date() },
    });
  }

  /**
   * Translate template content from one locale to another.
   */
  async translateTemplate(
    content: string,
    fromLocale: Locale,
    toLocale: Locale,
    providerId?: string,
  ): Promise<string> {
    const provider = await this.getProvider(providerId);
    const adapter = getAdapter(provider);

    const fromLang = LOCALE_NAMES[fromLocale] || fromLocale;
    const toLang = LOCALE_NAMES[toLocale] || toLocale;

    const systemPrompt = `You are a professional translator specializing in property management and hospitality communications. Translate the following content from ${fromLang} to ${toLang}.

Rules:
- Maintain the exact same formatting, HTML structure, and line breaks
- Preserve all template variables exactly as-is (e.g., {{guestName}}, {{propertyName}}, {{checkIn}})
- Do NOT translate variable names inside {{ }}
- Maintain the professional yet warm tone appropriate for hospitality
- For Hebrew (he), use right-to-left appropriate phrasing
- For Russian (ru), use formal "Вы" form
- Output ONLY the translated text, no explanations or notes`;

    const userPrompt = `Translate this from ${fromLang} to ${toLang}:\n\n${content}`;

    const result = await adapter.generate(systemPrompt, userPrompt);
    await this.markUsed(provider.id);

    return result.trim();
  }

  /**
   * Improve/rewrite template content based on instructions.
   */
  async improveTemplate(
    content: string,
    locale: Locale,
    instructions: string,
    providerId?: string,
  ): Promise<string> {
    const provider = await this.getProvider(providerId);
    const adapter = getAdapter(provider);

    const langName = LOCALE_NAMES[locale] || locale;

    const systemPrompt = `You are an expert copywriter specializing in property management and hospitality communications. You will improve the given template content in ${langName} based on the user's instructions.

Rules:
- Keep all template variables intact (e.g., {{guestName}}, {{propertyName}})
- Maintain the language (${langName}) of the original content
- If the content is HTML, maintain valid HTML structure
- Output ONLY the improved content, no explanations or notes
- Keep the professional yet warm hospitality tone`;

    const userPrompt = `Improve the following template content based on these instructions: "${instructions}"\n\nContent to improve:\n\n${content}`;

    const result = await adapter.generate(systemPrompt, userPrompt);
    await this.markUsed(provider.id);

    return result.trim();
  }

  /**
   * Generate a new template from a description.
   */
  async generateTemplate(
    description: string,
    locale: Locale,
    channel: 'email' | 'whatsapp' | 'sms',
    variables?: string[],
    providerId?: string,
  ): Promise<{ subject?: string; body: string }> {
    const provider = await this.getProvider(providerId);
    const adapter = getAdapter(provider);

    const langName = LOCALE_NAMES[locale] || locale;
    const varsText = variables?.length
      ? `Available variables (use as {{variableName}}): ${variables.join(', ')}`
      : 'Use appropriate template variables in {{variableName}} format.';

    let channelInstructions = '';
    if (channel === 'email') {
      channelInstructions = `Generate both an email subject line and an HTML email body. The HTML should be clean, professional, and mobile-responsive. Use the brand colors: background #030303 (dark) and accent #6b38d4 (purple). Include a simple header with the company name "Sivan Management".

Output format:
SUBJECT: <the subject line>
BODY: <the HTML body>`;
    } else if (channel === 'whatsapp') {
      channelInstructions = `Generate a WhatsApp message (plain text, can use emojis sparingly). Keep it concise and friendly.

Output format:
BODY: <the message text>`;
    } else {
      channelInstructions = `Generate an SMS message (plain text, max 160 characters if possible). Be extremely concise.

Output format:
BODY: <the SMS text>`;
    }

    const systemPrompt = `You are an expert copywriter for a property management company called "Sivan Management" that operates vacation rentals in Greece. Generate professional hospitality communications.

${varsText}

Write in ${langName}.
${channelInstructions}`;

    const userPrompt = `Generate a template for: ${description}`;

    const result = await adapter.generate(systemPrompt, userPrompt);
    await this.markUsed(provider.id);

    // Parse the result
    const subjectMatch = result.match(/SUBJECT:\s*(.*?)(?:\n|BODY:)/s);
    const bodyMatch = result.match(/BODY:\s*([\s\S]*)/);

    return {
      subject: subjectMatch ? subjectMatch[1].trim() : undefined,
      body: bodyMatch ? bodyMatch[1].trim() : result.trim(),
    };
  }

  /**
   * Translate content to all 6 supported locales at once.
   */
  async translateAll(
    content: string,
    fromLocale: Locale,
    providerId?: string,
  ): Promise<Record<string, string>> {
    const provider = await this.getProvider(providerId);
    const adapter = getAdapter(provider);

    const fromLang = LOCALE_NAMES[fromLocale] || fromLocale;
    const targetLocales = ALL_LOCALES.filter((l) => l !== fromLocale);
    const targetLangs = targetLocales.map((l) => `${l} (${LOCALE_NAMES[l]})`).join(', ');

    const systemPrompt = `You are a professional translator specializing in property management and hospitality communications. Translate the given content from ${fromLang} to ALL of these languages: ${targetLangs}.

Rules:
- Maintain the exact same formatting, HTML structure, and line breaks
- Preserve all template variables exactly as-is (e.g., {{guestName}}, {{propertyName}})
- Do NOT translate variable names inside {{ }}
- Maintain the professional yet warm tone appropriate for hospitality
- For Hebrew (he), use right-to-left appropriate phrasing
- For Russian (ru), use formal "Вы" form

Output ONLY valid JSON in this exact format (no markdown code blocks, no explanations):
{
  "${targetLocales[0]}": "translated text...",
  "${targetLocales[1]}": "translated text...",
  ${targetLocales.slice(2).map((l) => `"${l}": "translated text..."`).join(',\n  ')}
}`;

    const userPrompt = `Translate this from ${fromLang}:\n\n${content}`;

    const result = await adapter.generate(systemPrompt, userPrompt);
    await this.markUsed(provider.id);

    // Parse the JSON response
    try {
      // Try to extract JSON from the response (handle potential markdown wrapping)
      let jsonStr = result.trim();
      const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonStr = jsonMatch[0];
      }

      const translations = JSON.parse(jsonStr);

      // Include the original locale
      translations[fromLocale] = content;

      return translations;
    } catch {
      throw ApiError.badRequest(
        'Failed to parse AI translation response. Please try again.',
        'AI_PARSE_ERROR',
      );
    }
  }

  /**
   * Test an AI provider connection by sending a simple request.
   */
  async testProvider(providerId: string): Promise<{ success: boolean; message: string; responseTime: number }> {
    const provider = await prisma.aiProviderConfig.findUnique({ where: { id: providerId } });
    if (!provider) {
      throw ApiError.notFound('AiProviderConfig');
    }

    const adapter = getAdapter(provider);
    const startTime = Date.now();

    try {
      const result = await adapter.generate(
        'You are a test assistant. Respond with exactly: OK',
        'Respond with the word OK to confirm the connection works.',
      );

      const responseTime = Date.now() - startTime;

      if (!result || result.trim().length === 0) {
        return {
          success: false,
          message: 'Provider returned empty response',
          responseTime,
        };
      }

      return {
        success: true,
        message: `Connection successful. Response: "${result.trim().substring(0, 50)}"`,
        responseTime,
      };
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      return {
        success: false,
        message: error.message || 'Connection failed',
        responseTime,
      };
    }
  }
}

export const aiTemplateService = new AiTemplateService();
