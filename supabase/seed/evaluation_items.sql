-- ============================================================
-- VoiceCheck — Seed: Evaluation Items (banco de preguntas)
-- Age ranges in months: 24-36, 36-48, 48-60, 60-72
-- ============================================================

insert into evaluation_items (target_word, image_url, age_min_months, age_max_months, phonological_targets, difficulty_level) values
-- Age 24-36 months (2-3 years)
('casa',   '/images/casa.jpg',   24, 36, '{"EM-C1","ES-O"}', 1),
('perro',  '/images/perro.jpg',  24, 36, '{"EM-RD","ES-SL"}', 1),
('gato',   '/images/gato.jpg',   24, 36, '{"EM-G","EA-N"}', 1),
('mamá',   '/images/mama.jpg',   24, 36, '{"EM-MT"}', 1),
('agua',   '/images/agua.jpg',   24, 36, '{"EM-C2","EA-D"}', 1),
('leche',  '/images/leche.jpg',  24, 36, '{"ES-P","EA-L"}', 1),
('mesa',   '/images/mesa.jpg',   24, 36, '{"EM-C1","ES-F"}', 1),

-- Age 36-48 months (3-4 years)
('árbol',   '/images/arbol.jpg',   36, 48, '{"EM-G","ES-SL"}', 2),
('globo',   '/images/globo.jpg',   36, 48, '{"EM-G","EM-C3"}', 2),
('plato',   '/images/plato.jpg',   36, 48, '{"EM-G","ES-PS"}', 2),
('flor',    '/images/flor.jpg',    36, 48, '{"EM-G","EM-C3"}', 2),
('dragón',  '/images/dragon.jpg',  36, 48, '{"EM-G","ES-SL"}', 2),
('tren',    '/images/tren.jpg',    36, 48, '{"EM-G","ES-SLNL"}', 2),
('brujo',   '/images/brujo.jpg',   36, 48, '{"EM-G","EA-N"}', 2),

-- Age 48-60 months (4-5 years)
('mariposa',   '/images/mariposa.jpg',   48, 60, '{"ES-PS","EA-L"}', 3),
('elefante',   '/images/elefante.jpg',   48, 60, '{"EM-C2","ES-SL"}', 3),
('paraguas',   '/images/paraguas.jpg',   48, 60, '{"EM-G","ES-F"}', 3),
('escalera',   '/images/escalera.jpg',   48, 60, '{"EM-G","ES-SLNL"}', 3),
('chocolate',  '/images/chocolate.jpg',  48, 60, '{"EM-C2","ES-P"}', 3),

-- Age 60-72 months (5-6 years)
('refrigerador',  '/images/refrigerador.jpg',  60, 72, '{"EM-G","ES-SL","ES-SLNL"}', 4),
('estrella',      '/images/estrella.jpg',       60, 72, '{"EM-G","EM-C1","ES-SL"}', 4),
('computadora',   '/images/computadora.jpg',    60, 72, '{"EM-C2","EA-N"}', 4),
('trompeta',      '/images/trompeta.jpg',        60, 72, '{"EM-G","ES-SLNL"}', 4);
