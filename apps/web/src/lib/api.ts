import type {
  RegisterRequest,
  CreatePatientRequest,
  StartSessionRequest,
  SubmitRecordingRequest,
  AnalyzeRequest,
  AnalyzeResponse,
  ReportResponse,
  NextItemResponse,
  Patient,
  EvaluationSession,
  PrediagnosisReport,
  User,
} from '@voicecheck/types'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

async function apiRequest<T = unknown>(
  path: string,
  options?: RequestInit,
  token?: string
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Request failed' }))
    throw new Error(error.message || `HTTP ${res.status}`)
  }

  return res.json() as Promise<T>
}

export interface LanguageRequestData {
  name: string
  email: string
  language_requested: string
  country: string
}

export interface ReviewReportRequest {
  therapist_notes: string
  reviewed: boolean
}

export const api = {
  // Auth
  register: (data: RegisterRequest) =>
    apiRequest<{ user: User; access_token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Patients
  getPatients: (token: string) =>
    apiRequest<Patient[]>('/patients', {}, token),

  getPatient: (id: string, token: string) =>
    apiRequest<Patient>(`/patients/${id}`, {}, token),

  createPatient: (data: CreatePatientRequest, token: string) =>
    apiRequest<Patient>('/patients', { method: 'POST', body: JSON.stringify(data) }, token),

  updatePatient: (id: string, data: Partial<CreatePatientRequest>, token: string) =>
    apiRequest<Patient>(`/patients/${id}`, { method: 'PUT', body: JSON.stringify(data) }, token),

  // Sessions
  createSession: (data: StartSessionRequest, token: string) =>
    apiRequest<EvaluationSession>('/sessions', { method: 'POST', body: JSON.stringify(data) }, token),

  getSession: (sessionId: string, token: string) =>
    apiRequest<EvaluationSession>(`/sessions/${sessionId}`, {}, token),

  getNextItem: (sessionId: string, token: string) =>
    apiRequest<NextItemResponse>(`/sessions/${sessionId}/next-item`, {}, token),

  submitRecording: (sessionId: string, data: SubmitRecordingRequest, token: string) =>
    apiRequest<{ recording_id: string }>(`/sessions/${sessionId}/recordings`, {
      method: 'POST',
      body: JSON.stringify(data),
    }, token),

  analyzeRecording: (data: AnalyzeRequest, token: string) =>
    apiRequest<AnalyzeResponse>('/analyze', { method: 'POST', body: JSON.stringify(data) }, token),

  // Reports
  getReport: (sessionId: string, token: string) =>
    apiRequest<ReportResponse>(`/reports/${sessionId}`, {}, token),

  getTherapistReports: (token: string) =>
    apiRequest<ReportResponse[]>('/reports', {}, token),

  reviewReport: (reportId: string, data: ReviewReportRequest, token: string) =>
    apiRequest<PrediagnosisReport>(`/reports/${reportId}/review`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }, token),

  // Language requests
  submitLanguageRequest: (data: LanguageRequestData) =>
    apiRequest<{ success: boolean }>('/language-requests', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Audio signed URL
  getAudioUrl: (recordingId: string, token: string) =>
    apiRequest<{ url: string; expires_at: string }>(`/recordings/${recordingId}/url`, {}, token),
}
