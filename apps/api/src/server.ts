import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import { createClient } from '@supabase/supabase-js';

const app = Fastify({ logger: true });

// Plugins
await app.register(cors, {
  origin: process.env.ALLOWED_ORIGINS?.split(',') ?? ['http://localhost:3000'],
});

await app.register(jwt, {
  secret: process.env.JWT_SECRET ?? 'dev-secret-change-in-production',
});

await app.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute',
});

// Supabase client (service role — server only)
const supabase = createClient(
  process.env.SUPABASE_URL ?? '',
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
);

// Health check
app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

// Routes (to be expanded per module)
await app.register(import('./routes/auth.js'));
await app.register(import('./routes/patients.js'), { prefix: '/patients' });
await app.register(import('./routes/sessions.js'), { prefix: '/sessions' });
await app.register(import('./routes/reports.js'), { prefix: '/reports' });

const port = Number(process.env.PORT ?? 3001);
await app.listen({ port, host: '0.0.0.0' });
