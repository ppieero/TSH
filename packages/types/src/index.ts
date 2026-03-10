// ============================================================
// VoiceCheck — Shared TypeScript Types
// ============================================================

export type UserRole = 'guardian' | 'therapist' | 'admin';
export type SessionStatus = 'pending' | 'in_progress' | 'completed' | 'reported' | 'reviewed' | 'abandoned';
export type SeverityLevel = 'typical' | 'monitor' | 'attention' | 'urgent';
export type AudioQuality = 'good' | 'fair' | 'poor';
export type MimeType = 'audio/webm' | 'audio/mp4' | 'audio/ogg';
export type SupportedLocale = 'es' | 'en' | 'pt';

// 17 Phonological patterns
export type PhonologicalCode =
  // Omisiones (EM)
  | 'EM-C1' | 'EM-C2' | 'EM-C3' | 'EM-G' | 'EM-RD' | 'EM-MT' | 'EM-M'
  // Asimilaciones (EA)
  | 'EA-N' | 'EA-L' | 'EA-D'
  // Sustituciones (ES)
  | 'ES-O' | 'ES-F' | 'ES-P' | 'ES-SL' | 'ES-SLNL' | 'ES-PS';

export const ALL_PHONOLOGICAL_CODES: PhonologicalCode[] = [
  'EM-C1','EM-C2','EM-C3','EM-G','EM-RD','EM-MT','EM-M',
  'EA-N','EA-L','EA-D',
  'ES-O','ES-F','ES-P','ES-SL','ES-SLNL','ES-PS',
];

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  phone?: string;
  country_code: string;
  preferred_language: SupportedLocale;
  created_at: string;
  deleted_at?: string;
}

export interface Guardian {
  id: string;
  user_id: string;
  relationship: string;
  consent_at?: string;
  consent_ip?: string;
  consent_version: string;
}

export interface Patient {
  id: string;
  guardian_id: string;
  first_name: string;
  birth_date: string;
  gender?: string;
  native_language: string;
  can_read: boolean;
  notes?: string;
  created_at: string;
}

export interface Therapist {
  id: string;
  user_id: string;
  license_number?: string;
  country?: string;
  verified_at?: string;
}

export interface EvaluationItem {
  id: string;
  target_word: string;
  image_url: string;
  emoji: string;
  audio_url?: string;
  age_min_months: number;
  age_max_months: number;
  phonological_targets: PhonologicalCode[];
  difficulty_level: number;
  active: boolean;
  created_at: string;
}

export interface EvaluationSession {
  id: string;
  patient_id: string;
  guardian_id: string;
  therapist_id?: string;
  status: SessionStatus;
  age_months: number;
  can_read: boolean;
  started_at?: string;
  completed_at?: string;
  created_at: string;
}

export interface SessionRecording {
  id: string;
  session_id: string;
  item_id: string;
  storage_path: string; // encrypted path in Supabase Storage — NEVER expose directly
  duration_ms?: number;
  mime_type: MimeType;
  attempt_number: number;
  created_at: string;
}

export interface Deviation {
  code: PhonologicalCode;
  description: string;
  position?: string;
  example?: string;
}

export interface AIAnalysis {
  id: string;
  recording_id: string;
  transcribed?: string;
  match: boolean;
  deviations: Deviation[];
  diagnosis_codes: PhonologicalCode[];
  confidence: number; // 0.000–1.000
  audio_quality: AudioQuality;
  model_version: string;
  processed_at: string;
}

export interface ScoresByCategory {
  omissions: number;
  assimilations: number;
  substitutions: number;
  [key: string]: number;
}

export interface WordResult {
  item: EvaluationItem;
  recording?: SessionRecording;
  analysis?: AIAnalysis;
}

export interface PrediagnosisReport {
  id: string;
  session_id: string;
  patterns_found: PhonologicalCode[];
  severity_level: SeverityLevel;
  score_overall: number; // 0–100
  scores_by_category: ScoresByCategory;
  summary_es: string;
  recommendation: string;
  word_results: WordResult[];
  generated_at: string;
  reviewed_by?: string;
  reviewed_at?: string;
  therapist_notes?: string;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  action: string;
  resource: string;
  resource_id?: string;
  metadata?: Record<string, unknown>;
  ip_address?: string;
  created_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan: 'free' | 'basic' | 'pro';
  status: 'active' | 'cancelled' | 'expired';
  provider: 'mercadopago' | 'stripe';
  provider_subscription_id?: string;
  current_period_end?: string;
  created_at: string;
}

export interface LanguageRequest {
  id: string;
  name: string;
  email: string;
  language_requested: string;
  country: string;
  created_at: string;
}

// ---- API Request/Response types ----

export interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
  country_code?: string;
  preferred_language?: SupportedLocale;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  guardian?: Guardian;
  access_token: string;
  refresh_token: string;
}

export interface CreatePatientRequest {
  first_name: string;
  birth_date: string;
  gender?: string;
  native_language?: string;
  can_read: boolean;
  notes?: string;
}

export interface StartSessionRequest {
  patient_id: string;
}

export interface SubmitRecordingRequest {
  session_id: string;
  item_id: string;
  audio_base64: string;
  mime_type: MimeType;
  duration_ms: number;
}

export interface TranscribeRequest {
  recording_id: string;
}

export interface AnalyzeRequest {
  recording_id: string;
  session_id: string;
  item_id: string;
}

export interface AnalyzeResponse {
  analysis: AIAnalysis;
  next_item?: EvaluationItem;
  session_complete: boolean;
}

export interface ReportResponse {
  report: PrediagnosisReport;
  session: EvaluationSession;
  patient: Patient;
  items: EvaluationItem[];
  recordings: SessionRecording[];
  analyses: AIAnalysis[];
  disclaimer: string;
}

export interface NextItemResponse {
  item: EvaluationItem | null;
  session_complete: boolean;
  total_items: number;
  completed_items: number;
}

// Signed URL response (TTL 15 min — never store)
export interface SignedAudioUrl {
  url: string;
  expires_at: string;
}
