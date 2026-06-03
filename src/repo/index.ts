import { LocalRepo } from './local'
import type { PiggabilityRepo } from './types'

export * from './types'
export { LocalRepo } from './local'

/** Whether Supabase env flags are present. */
export function supabaseConfigured(): boolean {
  return Boolean(
    import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY,
  )
}

let instance: PiggabilityRepo | null = null

/**
 * Resolve the active repository. Uses Supabase when configured, otherwise the
 * localStorage repo. The Supabase adapter is imported lazily so its SDK is only
 * pulled in when actually used.
 */
export async function getRepo(): Promise<PiggabilityRepo> {
  if (instance) return instance
  if (supabaseConfigured()) {
    const { SupabaseRepo } = await import('./supabase')
    instance = new SupabaseRepo(
      import.meta.env.VITE_SUPABASE_URL as string,
      import.meta.env.VITE_SUPABASE_ANON_KEY as string,
      (import.meta.env.VITE_TENANT_ID as string) || 'default',
      (import.meta.env.VITE_SUPABASE_TABLE_PREFIX as string) || '',
    )
  } else {
    instance = new LocalRepo()
  }
  return instance
}

/** Human-readable label for the active persistence backend. */
export function repoLabel(): string {
  return supabaseConfigured() ? 'Supabase' : 'Local (browser)'
}
