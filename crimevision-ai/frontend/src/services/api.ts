const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api/v1'

export type Evidence = {
  id: string
  evidence_id?: string
  original_filename: string
  media_type: 'image' | 'video' | 'audio'
  file_size: number
  file_hash?: string
  upload_timestamp: string
  processing_status: string
}

export type EvidenceResponse = { evidence: Evidence[]; total: number; pages: number; current_page: number }
export type AnalysisResult = {
  analysis_id: string
  evidence_id: string
  analysis_type: string
  model_identifier: string
  processing_status: string
  result: {
    summary?: string
    transcript?: string
    observations?: string[]
    events?: Array<{ timestamp?: string; description: string }>
    limitations?: string[]
    disclaimer?: string
  }
}
export type TimelineEvent = {
  id: string
  event_type: string
  timestamp: string
  media_timestamp?: string
  title: string
  description: string
  evidence_id: string
  source: 'system_record' | 'ai_generated'
  is_estimate: boolean
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, init)
  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.error ?? `Request failed (${response.status})`)
  }
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

export const api = {
  health: () => request<{ status: string; service: string }>('/health'),
  capabilities: () => request<{ modules: Record<string, string>; models: Record<string, string | null> }>('/capabilities'),
  evidence: async () => {
    const first = await request<EvidenceResponse>('/evidence/?per_page=100')
    if (first.pages <= 1) return first
    const remaining = await Promise.all(Array.from({ length: first.pages - 1 }, (_, index) =>
      request<EvidenceResponse>(`/evidence/?per_page=100&page=${index + 2}`),
    ))
    return { ...first, evidence: [...first.evidence, ...remaining.flatMap(page => page.evidence)] }
  },
  upload: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return request<Evidence>('/evidence/upload', { method: 'POST', body: form })
  },
  removeEvidence: (id: string) => request<void>(`/evidence/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  analyze: (mediaType: Evidence['media_type'], id: string) => request<AnalysisResult>(`/analysis/${mediaType}/${encodeURIComponent(id)}`, { method: 'POST' }),
  timeline: () => request<{ events: TimelineEvent[]; total: number }>('/timeline'),
  ask: (message: string, evidenceIds: string[]) => request<{ answer: string; model: string; source_evidence: string[]; disclaimer: string }>('/chat/ask', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message, evidence_ids: evidenceIds }),
  }),
}

export const evidenceFileUrl = (id: string) => `${API_BASE}/evidence/${encodeURIComponent(id)}/file`

export function formatBytes(size: number) {
  if (size < 1024) return `${size} B`
  if (size < 1024 ** 2) return `${(size / 1024).toFixed(1)} KB`
  if (size < 1024 ** 3) return `${(size / 1024 ** 2).toFixed(1)} MB`
  return `${(size / 1024 ** 3).toFixed(2)} GB`
}
