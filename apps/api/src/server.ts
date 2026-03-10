import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import rateLimit from '@fastify/rate-limit'
import { createClient } from '@supabase/supabase-js'
import authRoutes from './routes/auth.js'
import patientRoutes from './routes/patients.js'
import sessionRoutes from './routes/sessions.js'
import recordingRoutes from './routes/recordings.js'
import reportRoutes from './routes/reports.js'
import analyzeRoutes from './routes/analyze.js'
import languageRequestRoutes from './routes/languageRequests.js'

const app = Fastify({ logger: true })

// Supabase admin client (service role - bypass RLS)
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

app.register(cors, {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
})

app.register(jwt, { secret: process.env.JWT_SECRET! })

app.register(rateLimit, { max: 100, timeWindow: '1 minute' })

app.get('/health', async () => ({ status: 'ok', version: '1.0.0' }))

app.register(authRoutes, { prefix: '/auth' })
app.register(patientRoutes, { prefix: '/patients' })
app.register(sessionRoutes, { prefix: '/sessions' })
app.register(recordingRoutes, { prefix: '/sessions' })
app.register(reportRoutes, { prefix: '/reports' })
app.register(analyzeRoutes, { prefix: '/analyze' })
app.register(languageRequestRoutes, { prefix: '/language-requests' })

const start = async () => {
  try {
    await app.listen({ port: Number(process.env.PORT) || 3001, host: '0.0.0.0' })
    console.log('VoiceCheck API running on port', process.env.PORT || 3001)
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}
start()
