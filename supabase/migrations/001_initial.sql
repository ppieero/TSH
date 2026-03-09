-- ============================================================
-- VoiceCheck — Initial Schema Migration
-- ============================================================

-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- ============================================================
-- USERS BASE
-- ============================================================
create table users (
  id            uuid primary key default gen_random_uuid(),
  email         text unique not null,
  full_name     text not null,
  role          text not null check (role in ('guardian','therapist','admin')),
  phone         text,
  country_code  char(2) default 'AR',
  created_at    timestamptz default now(),
  deleted_at    timestamptz  -- soft delete
);

-- ============================================================
-- PADRES / TUTORES
-- ============================================================
create table guardians (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references users(id),
  relationship     text default 'parent',
  consent_at       timestamptz,           -- LGPD: cuando aceptó términos
  consent_ip       inet,
  consent_version  text default '1.0'
);

-- ============================================================
-- PACIENTES (niños)
-- ============================================================
create table patients (
  id               uuid primary key default gen_random_uuid(),
  guardian_id      uuid not null references guardians(id),
  first_name       text not null,
  birth_date       date not null,
  gender           text,
  native_language  text default 'es',
  notes            text,
  created_at       timestamptz default now()
);

-- ============================================================
-- FONOAUDIÓLOGOS
-- ============================================================
create table therapists (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references users(id),
  license_number text,
  country        char(2),
  verified_at    timestamptz
);

-- ============================================================
-- BANCO DE PREGUNTAS (evaluation items)
-- ============================================================
create table evaluation_items (
  id                   uuid primary key default gen_random_uuid(),
  target_word          text not null,
  image_url            text not null,
  audio_url            text,
  age_min_months       int not null,
  age_max_months       int not null,
  phonological_targets text[] not null default '{}',
  difficulty_level     int default 1,
  active               boolean default true,
  created_at           timestamptz default now()
);

-- ============================================================
-- SESIONES DE EVALUACIÓN
-- ============================================================
create table evaluation_sessions (
  id            uuid primary key default gen_random_uuid(),
  patient_id    uuid not null references patients(id),
  guardian_id   uuid not null references guardians(id),
  therapist_id  uuid references therapists(id),
  status        text default 'pending' check (
    status in ('pending','in_progress','completed','reported','reviewed','abandoned')
  ),
  age_months    int,
  started_at    timestamptz,
  completed_at  timestamptz,
  created_at    timestamptz default now()
);

-- ============================================================
-- GRABACIONES POR PREGUNTA
-- ============================================================
create table session_recordings (
  id             uuid primary key default gen_random_uuid(),
  session_id     uuid not null references evaluation_sessions(id),
  item_id        uuid not null references evaluation_items(id),
  storage_path   text not null,        -- path en Supabase Storage (encriptado)
  duration_ms    int,
  mime_type      text default 'audio/webm',
  attempt_number int default 1,        -- permite repetir grabación
  created_at     timestamptz default now()
);

-- ============================================================
-- ANÁLISIS IA POR GRABACIÓN
-- ============================================================
create table ai_analyses (
  id              uuid primary key default gen_random_uuid(),
  recording_id    uuid not null references session_recordings(id),
  transcribed     text,                        -- texto que Whisper transcribió
  match           boolean,                     -- ¿coincide con target_word?
  deviations      jsonb,                       -- array de desviaciones detectadas
  diagnosis_codes text[],                      -- ['EM-C1', 'ES-O']
  confidence      numeric(4,3),                -- 0.000–1.000
  audio_quality   text,                        -- good|fair|poor
  model_version   text default 'gpt-4o',
  processed_at    timestamptz default now()
);

-- ============================================================
-- REPORTE DE PREDIAGNÓSTICO
-- ============================================================
create table prediagnosis_reports (
  id                  uuid primary key default gen_random_uuid(),
  session_id          uuid not null references evaluation_sessions(id),
  patterns_found      text[],                  -- códigos únicos detectados
  severity_level      text check (
    severity_level in ('typical','monitor','attention','urgent')
  ),
  score_overall       int,                     -- 0–100
  scores_by_category  jsonb,                   -- {omissions: 85, substitutions: 60, ...}
  summary_es          text,                    -- texto legible para padres
  recommendation      text,
  generated_at        timestamptz default now(),
  reviewed_by         uuid references therapists(id),
  reviewed_at         timestamptz,
  therapist_notes     text
);

-- ============================================================
-- SUSCRIPCIONES
-- ============================================================
create table subscriptions (
  id                        uuid primary key default gen_random_uuid(),
  user_id                   uuid not null references users(id),
  plan                      text not null check (plan in ('free','basic','pro')),
  status                    text not null check (status in ('active','cancelled','expired')),
  provider                  text check (provider in ('mercadopago','stripe')),
  provider_subscription_id  text,
  current_period_end        timestamptz,
  created_at                timestamptz default now()
);

-- ============================================================
-- AUDIT LOG (inmutable)
-- ============================================================
create table audit_logs (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references users(id),
  action       text not null,
  resource     text not null,
  resource_id  uuid,
  metadata     jsonb,
  ip_address   inet,
  created_at   timestamptz default now()
);
-- RLS: INSERT-only, nunca UPDATE/DELETE en audit_logs

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS on all patient-data tables
alter table patients enable row level security;
alter table guardians enable row level security;
alter table evaluation_sessions enable row level security;
alter table session_recordings enable row level security;
alter table ai_analyses enable row level security;
alter table prediagnosis_reports enable row level security;
alter table subscriptions enable row level security;
alter table audit_logs enable row level security;

-- Guardians: only see own record
create policy "guardian_select_own"
  on guardians for select
  using (user_id = auth.uid());

create policy "guardian_insert_own"
  on guardians for insert
  with check (user_id = auth.uid());

-- Patients: guardian sees only their patients
create policy "patient_select_own"
  on patients for select
  using (
    guardian_id in (
      select id from guardians where user_id = auth.uid()
    )
  );

create policy "patient_insert_own"
  on patients for insert
  with check (
    guardian_id in (
      select id from guardians where user_id = auth.uid()
    )
  );

create policy "patient_update_own"
  on patients for update
  using (
    guardian_id in (
      select id from guardians where user_id = auth.uid()
    )
  );

-- Evaluation sessions: guardian sees their sessions
create policy "session_select_guardian"
  on evaluation_sessions for select
  using (
    guardian_id in (
      select id from guardians where user_id = auth.uid()
    )
  );

create policy "session_insert_guardian"
  on evaluation_sessions for insert
  with check (
    guardian_id in (
      select id from guardians where user_id = auth.uid()
    )
  );

create policy "session_update_guardian"
  on evaluation_sessions for update
  using (
    guardian_id in (
      select id from guardians where user_id = auth.uid()
    )
  );

-- Therapists: see sessions assigned to them
create policy "session_select_therapist"
  on evaluation_sessions for select
  using (
    therapist_id in (
      select id from therapists where user_id = auth.uid()
    )
  );

-- Session recordings: guardian access via session
create policy "recording_select_guardian"
  on session_recordings for select
  using (
    session_id in (
      select id from evaluation_sessions
      where guardian_id in (
        select id from guardians where user_id = auth.uid()
      )
    )
  );

create policy "recording_insert_guardian"
  on session_recordings for insert
  with check (
    session_id in (
      select id from evaluation_sessions
      where guardian_id in (
        select id from guardians where user_id = auth.uid()
      )
    )
  );

-- AI analyses: guardian sees via recording → session
create policy "ai_analysis_select_guardian"
  on ai_analyses for select
  using (
    recording_id in (
      select sr.id from session_recordings sr
      join evaluation_sessions es on sr.session_id = es.id
      join guardians g on es.guardian_id = g.id
      where g.user_id = auth.uid()
    )
  );

-- Prediagnosis reports: guardian sees their reports
create policy "report_select_guardian"
  on prediagnosis_reports for select
  using (
    session_id in (
      select id from evaluation_sessions
      where guardian_id in (
        select id from guardians where user_id = auth.uid()
      )
    )
  );

-- Therapists can update reports they reviewed
create policy "report_update_therapist"
  on prediagnosis_reports for update
  using (
    reviewed_by in (
      select id from therapists where user_id = auth.uid()
    )
  );

-- Subscriptions: user sees own
create policy "subscription_select_own"
  on subscriptions for select
  using (user_id = auth.uid());

-- Audit logs: INSERT-only for authenticated users
create policy "audit_insert_only"
  on audit_logs for insert
  with check (true);

-- No SELECT policy on audit_logs for regular users (admin only via service role)

-- ============================================================
-- INDEXES
-- ============================================================
create index idx_patients_guardian on patients(guardian_id);
create index idx_sessions_patient on evaluation_sessions(patient_id);
create index idx_sessions_guardian on evaluation_sessions(guardian_id);
create index idx_recordings_session on session_recordings(session_id);
create index idx_analyses_recording on ai_analyses(recording_id);
create index idx_reports_session on prediagnosis_reports(session_id);
create index idx_audit_user on audit_logs(user_id);
create index idx_audit_resource on audit_logs(resource, resource_id);
