# VoiceCheck — guía para agentes

Plataforma de **cribado (screening) fonológico infantil** en español: el niño graba palabras objetivo, el audio se transcribe con Whisper, GPT-4o detecta procesos fonológicos (códigos `EM-*`, `EA-*`, `ES-*`) y se genera un *pre-diagnóstico* que revisa un fonoaudiólogo. **No es un diagnóstico clínico** (ver `DISCLAIMER_ES`).

## Stack
- Monorepo **npm workspaces + Turborepo** (`apps/*`, `packages/*`). Gestor: npm (`package-lock.json`), no pnpm/yarn.
- `apps/web`: Next.js 14.1 (App Router, `src/app`), React 18, Tailwind 3, react-hook-form + zod 4, lucide-react, `@supabase/ssr`.
- `apps/api`: Fastify 4 (ESM, `"type": "module"`), zod 3, axios, `@supabase/supabase-js`. Puerto 3001.
- `apps/mobile`: Expo 50 + expo-router 3, expo-av (grabación). Solo esqueleto.
- `services/voice-ai`: Python 3.11, FastAPI + uvicorn, openai 1.12, supabase-py. Puerto 8000.
- `supabase/`: migraciones SQL (Postgres + RLS) y seed.

## Estructura clave
- `apps/api/src/server.ts` — registra plugins (cors, jwt, rate-limit 100/min) y rutas; exporta `supabaseAdmin` (service role, **salta RLS**).
- `apps/api/src/routes/*.ts` — una ruta por recurso (`auth`, `patients`, `sessions`, `recordings`, `reports`, `analyze`, `language-requests`).
- `apps/api/src/middleware/auth.ts` — `authenticate`: valida el Bearer token de Supabase y pone `request.userId`.
- `apps/web/middleware.ts` — redirige a prefijo de locale (`es` por defecto, `en`, `pt`) y protege `/dashboard` y `/terapeuta` por cookie de Supabase.
- `apps/web/src/lib/` — `api.ts` (cliente HTTP a la API), `i18n/` (`useTranslation`, `translations.ts` ES/EN/PT), `supabase/{client,server}.ts`, `utils.ts` (`cn`, `formatDate`, `calculateAge`).
- `apps/web/src/components/{ui,auth,layout,marketing}` — componentes propios; reutiliza `components/ui` antes de crear nuevos.
- `packages/types` — tipos compartidos (`@voicecheck/types`). Fuente de verdad de dominio.
- `packages/diagnosis-engine` — `generateReport()` y `PATTERN_DESCRIPTIONS`; se consume como TS fuente (`main: ./src/index.ts`).
- `packages/ui` — placeholder (solo `UI_VERSION`).
- `services/voice-ai/main.py` — endpoints `/health`, `/transcribe`, `/analyze`, `/analyze-full`; lógica en `services/` (whisper, gpt4o, openai_client), patrones en `phonology/`, prompt en `prompts/analyze_phonology.txt`.

## Comandos (reales)
Raíz (vía turbo):
```bash
npm install
npm run dev          # turbo dev (todas las apps)
npm run build        # turbo build
npm run type-check   # turbo type-check (web, diagnosis-engine...)
npm run lint         # turbo lint
```
Por workspace: `npm run dev -w @voicecheck/web` / `-w @voicecheck/api`; `npm run start -w @voicecheck/mobile` (expo start).
API: `dev` = `tsx watch src/server.ts`, `build` = `tsc` → `dist/`, `start` = `node dist/server.js`.
Voice AI:
```bash
cd services/voice-ai && pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000   # o: docker build . (Dockerfile incluido)
```
- **No hay tests** en el repo (ni jest/vitest ni pytest). No inventes un comando de test; verifica con `type-check`/`build`.
- **No hay config de ESLint** versionada: `lint` de api/mobile (`eslint`) y web (`next lint`) puede fallar o pedir setup interactivo.

## Variables de entorno
Plantillas: `.env.example` (raíz) y `services/voice-ai/.env.example`. Nunca commitees `.env`.
- API: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`, `JWT_SECRET`, `ALLOWED_ORIGINS`, `PORT`, `AI_SERVICE_URL` (def. `http://localhost:8000`), `APP_URL`.
- Web: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_API_URL` (def. `http://localhost:3001`; `/api/*` se reescribe a la API).
- Voice AI: `OPENAI_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ALLOWED_ORIGINS`.

## Flujo e integraciones
web/mobile → API Fastify (`/analyze`) → voice-ai `/analyze-full` (descarga audio del bucket Storage `recordings`, Whisper → GPT-4o) → API guarda en `ai_analyses` → `diagnosis-engine` genera `prediagnosis_reports`.
Externos: **Supabase** (Auth, Postgres, Storage), **OpenAI** (Whisper + GPT-4o).

## Convenciones
- TypeScript estricto vía `tsconfig.base.json`; paquetes internos con scope `@voicecheck/*`.
- API: imports relativos con extensión `.js` (ESM), validación de body con `zod` (`Schema.parse`), `preHandler: authenticate` en rutas privadas, errores como `reply.status(n).send({ error })`.
- Tablas y columnas en `snake_case` (ver `supabase/migrations/001_initial.sql`).
- Textos de UI vía `useTranslation` y `translations.ts` (añade la clave en es/en/pt); español es el idioma por defecto.
- Web: `cn()` para clases Tailwind; formularios con react-hook-form + zod.

## Qué NO tocar
- `supabase/migrations/00*.sql` ya aplicadas: no las edites; crea una nueva `003_*.sql`.
- Políticas RLS: no las relajes. `supabaseAdmin` salta RLS → filtra siempre por `userId` en la API.
- `DISCLAIMER_ES` y el carácter de "no diagnóstico" de los informes (requisito clínico/legal).
- Pin `httpx==0.25.2` en `requirements.txt` (supabase 2.3.4 exige `httpx<0.26`).
- Versiones de Expo/React Native en mobile (deben ir alineadas con Expo 50).
- `package-lock.json`: no lo regeneres con otro gestor.

## Estado
Proyecto en fase scaffold/WIP: web solo tiene `src/app/layout.tsx` y `page.tsx` (sin rutas `[locale]` aunque el middleware redirige a `/es`); mobile y `packages/ui` son esqueletos.
