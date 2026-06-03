import type { Segment, StudyInputs } from '../engine/types'

export interface Project {
  id: string
  name: string
  client: string
  code: string
  createdAt: string
}

/** A segment as stored, linked to its project. */
export type StoredSegment = Segment & { projectId: string }

/**
 * Persistence contract. Two implementations: LocalRepo (localStorage, default)
 * and SupabaseRepo (Postgres, behind env flags). All methods are async so the
 * two are interchangeable.
 */
export interface PiggabilityRepo {
  listProjects(): Promise<Project[]>
  getProject(id: string): Promise<Project | null>
  saveProject(project: Project): Promise<void>
  deleteProject(id: string): Promise<void>

  listSegments(projectId: string): Promise<StoredSegment[]>
  getSegment(id: string): Promise<StoredSegment | null>
  saveSegment(segment: StoredSegment): Promise<void>
  deleteSegment(id: string): Promise<void>

  getStudy(segmentId: string): Promise<StudyInputs | null>
  saveStudy(segmentId: string, inputs: StudyInputs): Promise<void>
}
