import type { AiConfig, AiMessage, AiProvider } from './types'

/**
 * Browser OpenAI client (Chat Completions). PROTOTYPE transport: the key is
 * supplied by the user and stays in their browser. Swap for a server proxy
 * (e.g. Supabase Edge Function) for production by implementing AiProvider.
 *
 * The model is explicit and caller-controlled — never silently downgraded.
 */
export class BrowserOpenAIProvider implements AiProvider {
  constructor(private cfg: AiConfig) {}

  async complete(messages: AiMessage[]): Promise<string> {
    const base = this.cfg.baseUrl ?? 'https://api.openai.com/v1'
    const res = await fetch(`${base}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.cfg.apiKey}`,
      },
      body: JSON.stringify({
        model: this.cfg.model,
        messages,
        temperature: 0.3,
      }),
    })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(`OpenAI ${res.status}: ${text.slice(0, 240) || res.statusText}`)
    }
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[]
    }
    return data.choices?.[0]?.message?.content?.trim() ?? ''
  }
}
