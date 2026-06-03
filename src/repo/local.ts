import { SEED_PROJECT, SEED_SEGMENTS, SEED_STUDIES } from '../data/seed'
import type { StudyInputs } from '../engine/types'
import type { PiggabilityRepo, Project, StoredSegment } from './types'

const KEY = 'piggability.v1'

interface Store {
  projects: Project[]
  segments: StoredSegment[]
  studies: Record<string, StudyInputs>
}

function seeded(): Store {
  return {
    projects: [{ ...SEED_PROJECT, createdAt: '2026-06-03T00:00:00.000Z' }],
    segments: SEED_SEGMENTS.map((s) => ({ ...s, projectId: SEED_PROJECT.id })),
    studies: { ...SEED_STUDIES },
  }
}

function hasLocalStorage(): boolean {
  try {
    return typeof localStorage !== 'undefined'
  } catch {
    return false
  }
}

/**
 * localStorage-backed repository. Falls back to an in-memory store when
 * localStorage is unavailable (e.g. SSR / tests). Seeds the pilot fleet on
 * first use so the app is fully functional with zero configuration.
 */
export class LocalRepo implements PiggabilityRepo {
  private memory: Store | null = null

  private read(): Store {
    if (hasLocalStorage()) {
      const raw = localStorage.getItem(KEY)
      if (raw) {
        try {
          return JSON.parse(raw) as Store
        } catch {
          // fall through to reseed on corrupt data
        }
      }
      const fresh = seeded()
      this.write(fresh)
      return fresh
    }
    if (!this.memory) this.memory = seeded()
    return this.memory
  }

  private write(store: Store): void {
    if (hasLocalStorage()) {
      localStorage.setItem(KEY, JSON.stringify(store))
    } else {
      this.memory = store
    }
  }

  async listProjects(): Promise<Project[]> {
    return this.read().projects
  }

  async getProject(id: string): Promise<Project | null> {
    return this.read().projects.find((p) => p.id === id) ?? null
  }

  async saveProject(project: Project): Promise<void> {
    const store = this.read()
    const i = store.projects.findIndex((p) => p.id === project.id)
    if (i >= 0) store.projects[i] = project
    else store.projects.push(project)
    this.write(store)
  }

  async deleteProject(id: string): Promise<void> {
    const store = this.read()
    store.projects = store.projects.filter((p) => p.id !== id)
    const removed = store.segments.filter((s) => s.projectId === id).map((s) => s.id)
    store.segments = store.segments.filter((s) => s.projectId !== id)
    for (const sid of removed) delete store.studies[sid]
    this.write(store)
  }

  async listSegments(projectId: string): Promise<StoredSegment[]> {
    return this.read().segments.filter((s) => s.projectId === projectId)
  }

  async getSegment(id: string): Promise<StoredSegment | null> {
    return this.read().segments.find((s) => s.id === id) ?? null
  }

  async saveSegment(segment: StoredSegment): Promise<void> {
    const store = this.read()
    const i = store.segments.findIndex((s) => s.id === segment.id)
    if (i >= 0) store.segments[i] = segment
    else store.segments.push(segment)
    this.write(store)
  }

  async deleteSegment(id: string): Promise<void> {
    const store = this.read()
    store.segments = store.segments.filter((s) => s.id !== id)
    delete store.studies[id]
    this.write(store)
  }

  async getStudy(segmentId: string): Promise<StudyInputs | null> {
    return this.read().studies[segmentId] ?? null
  }

  async saveStudy(segmentId: string, inputs: StudyInputs): Promise<void> {
    const store = this.read()
    store.studies[segmentId] = inputs
    this.write(store)
  }
}
