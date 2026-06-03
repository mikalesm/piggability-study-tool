import { BrowserOpenAIProvider } from './openai'
import type { AiProvider } from './types'

export * from './types'
export * as prompts from './prompts'

const KEY = 'piggability.ai'
export const DEFAULT_MODEL = 'gpt-4o-mini'

export interface StoredAiConfig {
  apiKey: string
  model: string
}

export function loadAiConfig(): StoredAiConfig | null {
  if (typeof localStorage === 'undefined') return null
  const raw = localStorage.getItem(KEY)
  if (!raw) return null
  try {
    const c = JSON.parse(raw) as Partial<StoredAiConfig>
    if (!c.apiKey) return null
    return { apiKey: c.apiKey, model: c.model || DEFAULT_MODEL }
  } catch {
    return null
  }
}

export function saveAiConfig(cfg: StoredAiConfig): void {
  if (typeof localStorage !== 'undefined') localStorage.setItem(KEY, JSON.stringify(cfg))
}

export function clearAiConfig(): void {
  if (typeof localStorage !== 'undefined') localStorage.removeItem(KEY)
}

export function aiConfigured(): boolean {
  return Boolean(loadAiConfig()?.apiKey)
}

/** Active provider, or null when no key is configured. */
export function getAiProvider(): AiProvider | null {
  const cfg = loadAiConfig()
  if (!cfg) return null
  return new BrowserOpenAIProvider(cfg)
}
