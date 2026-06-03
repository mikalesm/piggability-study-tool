export interface AiMessage {
  role: 'system' | 'user'
  content: string
}

export interface AiConfig {
  apiKey: string
  model: string
  baseUrl?: string
}

/** Minimal completion provider — implemented by the browser OpenAI client now, */
/** and swappable for a server proxy later without touching callers. */
export interface AiProvider {
  complete(messages: AiMessage[]): Promise<string>
}
