import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Segment, StudyInputs } from '../engine/types'
import type { PiggabilityRepo, Project, StoredSegment } from './types'

/**
 * Supabase (Postgres) repository, enabled when VITE_SUPABASE_URL and
 * VITE_SUPABASE_ANON_KEY are set. Multi-tenant: every row carries tenant_id and
 * RLS scopes reads/writes to the caller's tenant (see supabase/migrations).
 *
 * Segment and study payloads are stored as jsonb so the engine's types remain
 * the single source of truth without schema churn.
 */
export class SupabaseRepo implements PiggabilityRepo {
  private client: SupabaseClient
  private tenantId: string

  constructor(url: string, anonKey: string, tenantId: string) {
    this.client = createClient(url, anonKey)
    this.tenantId = tenantId
  }

  async listProjects(): Promise<Project[]> {
    const { data, error } = await this.client
      .from('project')
      .select('id,name,client,code,created_at')
      .eq('tenant_id', this.tenantId)
    if (error) throw error
    return (data ?? []).map((r) => ({
      id: r.id,
      name: r.name,
      client: r.client,
      code: r.code,
      createdAt: r.created_at,
    }))
  }

  async getProject(id: string): Promise<Project | null> {
    const { data, error } = await this.client
      .from('project')
      .select('id,name,client,code,created_at')
      .eq('tenant_id', this.tenantId)
      .eq('id', id)
      .maybeSingle()
    if (error) throw error
    if (!data) return null
    return {
      id: data.id,
      name: data.name,
      client: data.client,
      code: data.code,
      createdAt: data.created_at,
    }
  }

  async saveProject(project: Project): Promise<void> {
    const { error } = await this.client.from('project').upsert({
      id: project.id,
      tenant_id: this.tenantId,
      name: project.name,
      client: project.client,
      code: project.code,
      created_at: project.createdAt,
    })
    if (error) throw error
  }

  async deleteProject(id: string): Promise<void> {
    const { error } = await this.client
      .from('project')
      .delete()
      .eq('tenant_id', this.tenantId)
      .eq('id', id)
    if (error) throw error
  }

  async listSegments(projectId: string): Promise<StoredSegment[]> {
    const { data, error } = await this.client
      .from('segment')
      .select('id,project_id,payload')
      .eq('tenant_id', this.tenantId)
      .eq('project_id', projectId)
    if (error) throw error
    return (data ?? []).map((r) => ({
      ...(r.payload as Segment),
      id: r.id,
      projectId: r.project_id,
    }))
  }

  async getSegment(id: string): Promise<StoredSegment | null> {
    const { data, error } = await this.client
      .from('segment')
      .select('id,project_id,payload')
      .eq('tenant_id', this.tenantId)
      .eq('id', id)
      .maybeSingle()
    if (error) throw error
    if (!data) return null
    return { ...(data.payload as Segment), id: data.id, projectId: data.project_id }
  }

  async saveSegment(segment: StoredSegment): Promise<void> {
    const { projectId, ...rest } = segment
    const { error } = await this.client.from('segment').upsert({
      id: segment.id,
      tenant_id: this.tenantId,
      project_id: projectId,
      payload: rest as Segment,
    })
    if (error) throw error
  }

  async deleteSegment(id: string): Promise<void> {
    const { error } = await this.client
      .from('segment')
      .delete()
      .eq('tenant_id', this.tenantId)
      .eq('id', id)
    if (error) throw error
  }

  async getStudy(segmentId: string): Promise<StudyInputs | null> {
    const { data, error } = await this.client
      .from('study_input')
      .select('segment_id,payload')
      .eq('tenant_id', this.tenantId)
      .eq('segment_id', segmentId)
      .maybeSingle()
    if (error) throw error
    return data ? (data.payload as StudyInputs) : null
  }

  async saveStudy(segmentId: string, inputs: StudyInputs): Promise<void> {
    const { error } = await this.client.from('study_input').upsert({
      segment_id: segmentId,
      tenant_id: this.tenantId,
      payload: inputs,
    })
    if (error) throw error
  }
}
