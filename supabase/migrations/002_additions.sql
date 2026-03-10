-- ============================================================
-- VoiceCheck — Migration 002: Additional fields
-- ============================================================

-- Add preferred_language to users
alter table users
  add column if not exists preferred_language text default 'es'
    check (preferred_language in ('es','en','pt'));

-- Add can_read to patients
alter table patients
  add column if not exists can_read boolean default false;

-- Add emoji to evaluation_items
alter table evaluation_items
  add column if not exists emoji text default '';

-- Add can_read to evaluation_sessions (snapshot at session start)
alter table evaluation_sessions
  add column if not exists can_read boolean default false;

-- ============================================================
-- LANGUAGE REQUESTS (marketing form)
-- ============================================================
create table if not exists language_requests (
  id                 uuid primary key default gen_random_uuid(),
  name               text not null,
  email              text not null,
  language_requested text not null,
  country            text not null,
  created_at         timestamptz default now()
);

-- ============================================================
-- Update evaluation_items with emojis
-- ============================================================
update evaluation_items set emoji = '🏠' where target_word = 'casa';
update evaluation_items set emoji = '🐕' where target_word = 'perro';
update evaluation_items set emoji = '🐈' where target_word = 'gato';
update evaluation_items set emoji = '👩' where target_word = 'mamá';
update evaluation_items set emoji = '💧' where target_word = 'agua';
update evaluation_items set emoji = '🥛' where target_word = 'leche';
update evaluation_items set emoji = '🪑' where target_word = 'mesa';
update evaluation_items set emoji = '🌳' where target_word = 'árbol';
update evaluation_items set emoji = '🎈' where target_word = 'globo';
update evaluation_items set emoji = '🍽️' where target_word = 'plato';
update evaluation_items set emoji = '🌸' where target_word = 'flor';
update evaluation_items set emoji = '🐉' where target_word = 'dragón';
update evaluation_items set emoji = '🚂' where target_word = 'tren';
update evaluation_items set emoji = '🧙' where target_word = 'brujo';
update evaluation_items set emoji = '🦋' where target_word = 'mariposa';
update evaluation_items set emoji = '🐘' where target_word = 'elefante';
update evaluation_items set emoji = '☂️' where target_word = 'paraguas';
update evaluation_items set emoji = '🪜' where target_word = 'escalera';
update evaluation_items set emoji = '🍫' where target_word = 'chocolate';
update evaluation_items set emoji = '❄️' where target_word = 'refrigerador';
update evaluation_items set emoji = '⭐' where target_word = 'estrella';
update evaluation_items set emoji = '💻' where target_word = 'computadora';
update evaluation_items set emoji = '🎺' where target_word = 'trompeta';

-- Insert additional words that cover all 17 phonological patterns
insert into evaluation_items (target_word, image_url, emoji, age_min_months, age_max_months, phonological_targets, difficulty_level)
values
-- More pattern-specific words for better coverage
('pan',         '/images/pan.jpg',        '🍞', 36, 48, '{"EM-C1"}',        2),
('dos',         '/images/dos.jpg',        '✌️', 36, 48, '{"EM-C2"}',        2),
('sol',         '/images/sol.jpg',        '☀️', 36, 48, '{"EM-C3"}',        2),
('tierra',      '/images/tierra.jpg',     '🌍', 48, 60, '{"EM-RD"}',        3),
('teléfono',    '/images/telefono.jpg',   '📞', 48, 60, '{"EM-MT"}',        3),
('cocodrilo',   '/images/cocodrilo.jpg',  '🐊', 60, 72, '{"EM-M"}',         4),
('boca',        '/images/boca.jpg',       '👄', 36, 48, '{"EA-N"}',         2),
('cama',        '/images/cama.jpg',       '🛏️', 36, 48, '{"EA-L"}',         2),
('dedo',        '/images/dedo.jpg',       '☝️', 36, 48, '{"EA-D"}',         2),
('zapato',      '/images/zapato.jpg',     '👟', 48, 60, '{"ES-SL"}',        3),
('sol',         '/images/sol2.jpg',       '🌞', 48, 60, '{"ES-F"}',         3),
('pájaro',      '/images/pajaro.jpg',     '🐦', 48, 60, '{"ES-P"}',         3),
('mano',        '/images/mano.jpg',       '✋', 36, 48, '{"ES-SLNL","EA-N"}',2),
('puerta',      '/images/puerta.jpg',     '🚪', 48, 60, '{"EM-RD"}',        3),
('brazo',       '/images/brazo.jpg',      '💪', 48, 60, '{"EM-G"}',         3),
('manta',       '/images/manta.jpg',      '🛏️', 36, 48, '{"EM-C1"}',        2),
('mes',         '/images/mes.jpg',        '📅', 36, 48, '{"EM-C2"}',        2),
('mar',         '/images/mar.jpg',        '🌊', 36, 48, '{"EM-C3"}',        2),
('falda',       '/images/falda.jpg',      '👗', 36, 48, '{"EM-C3"}',        2),
('peligro',     '/images/peligro.jpg',    '⚠️', 60, 72, '{"EM-M"}',         4);

-- ============================================================
-- RLS for language_requests (public insert)
-- ============================================================
alter table language_requests enable row level security;

create policy "language_request_insert_public"
  on language_requests for insert
  with check (true);
