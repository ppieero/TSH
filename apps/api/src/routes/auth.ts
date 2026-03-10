import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { supabaseAdmin } from '../server.js'
import { authenticate } from '../middleware/auth.js'

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  full_name: z.string().min(2),
  country_code: z.string().length(2).default('AR'),
  preferred_language: z.enum(['es', 'en', 'pt']).default('es'),
})

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

const ResetPasswordSchema = z.object({
  email: z.string().email(),
})

export default async function authRoutes(app: FastifyInstance) {
  // POST /auth/register
  app.post('/register', async (request, reply) => {
    try {
      const body = RegisterSchema.parse(request.body)

      // 1. Create Supabase auth user
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: body.email,
        password: body.password,
        email_confirm: true,
      })

      if (authError || !authData.user) {
        return reply.status(400).send({ error: authError?.message || 'Failed to create user' })
      }

      const userId = authData.user.id

      // 2. Insert into users table
      const { data: userRecord, error: userError } = await supabaseAdmin
        .from('users')
        .insert({
          id: userId,
          email: body.email,
          full_name: body.full_name,
          role: 'guardian',
          country_code: body.country_code,
          preferred_language: body.preferred_language,
        })
        .select()
        .single()

      if (userError) {
        // Rollback auth user
        await supabaseAdmin.auth.admin.deleteUser(userId)
        return reply.status(500).send({ error: userError.message })
      }

      // 3. Insert into guardians table
      const { data: guardianRecord, error: guardianError } = await supabaseAdmin
        .from('guardians')
        .insert({
          user_id: userId,
          relationship: 'parent',
          consent_at: new Date().toISOString(),
          consent_version: '1.0',
        })
        .select()
        .single()

      if (guardianError) {
        return reply.status(500).send({ error: guardianError.message })
      }

      // 4. Sign in to get tokens
      const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
        email: body.email,
        password: body.password,
      })

      if (signInError) {
        return reply.status(500).send({ error: signInError.message })
      }

      return reply.status(201).send({
        user: userRecord,
        guardian: guardianRecord,
        access_token: signInData.session?.access_token,
        refresh_token: signInData.session?.refresh_token,
      })
    } catch (error: any) {
      app.log.error(error)
      if (error.name === 'ZodError') {
        return reply.status(400).send({ error: 'Validation error', details: error.errors })
      }
      reply.status(500).send({ error: error.message || 'Internal server error' })
    }
  })

  // POST /auth/login
  app.post('/login', async (request, reply) => {
    try {
      const body = LoginSchema.parse(request.body)

      // 1. Sign in with Supabase Auth
      const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
        email: body.email,
        password: body.password,
      })

      if (signInError || !signInData.user) {
        return reply.status(401).send({ error: signInError?.message || 'Invalid credentials' })
      }

      // 2. Get user from users table
      const { data: userRecord, error: userError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', signInData.user.id)
        .is('deleted_at', null)
        .single()

      if (userError || !userRecord) {
        return reply.status(404).send({ error: 'User profile not found' })
      }

      // 3. Get guardian record if applicable
      let guardian = null
      if (userRecord.role === 'guardian') {
        const { data: guardianData } = await supabaseAdmin
          .from('guardians')
          .select('*')
          .eq('user_id', signInData.user.id)
          .single()
        guardian = guardianData
      }

      return reply.send({
        user: userRecord,
        guardian,
        access_token: signInData.session?.access_token,
        refresh_token: signInData.session?.refresh_token,
      })
    } catch (error: any) {
      app.log.error(error)
      if (error.name === 'ZodError') {
        return reply.status(400).send({ error: 'Validation error', details: error.errors })
      }
      reply.status(500).send({ error: error.message || 'Internal server error' })
    }
  })

  // POST /auth/reset-password
  app.post('/reset-password', async (request, reply) => {
    try {
      const body = ResetPasswordSchema.parse(request.body)

      const { error } = await supabaseAdmin.auth.resetPasswordForEmail(body.email, {
        redirectTo: `${process.env.APP_URL || 'http://localhost:3000'}/auth/reset-password`,
      })

      if (error) {
        return reply.status(400).send({ error: error.message })
      }

      return reply.send({ success: true, message: 'Password reset email sent' })
    } catch (error: any) {
      app.log.error(error)
      if (error.name === 'ZodError') {
        return reply.status(400).send({ error: 'Validation error', details: error.errors })
      }
      reply.status(500).send({ error: error.message || 'Internal server error' })
    }
  })

  // GET /auth/me
  app.get('/me', { preHandler: authenticate }, async (request, reply) => {
    try {
      const userId = (request as any).userId

      const { data: userRecord, error: userError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', userId)
        .is('deleted_at', null)
        .single()

      if (userError || !userRecord) {
        return reply.status(404).send({ error: 'User not found' })
      }

      let guardian = null
      if (userRecord.role === 'guardian') {
        const { data: guardianData } = await supabaseAdmin
          .from('guardians')
          .select('*')
          .eq('user_id', userId)
          .single()
        guardian = guardianData
      }

      let therapist = null
      if (userRecord.role === 'therapist') {
        const { data: therapistData } = await supabaseAdmin
          .from('therapists')
          .select('*')
          .eq('user_id', userId)
          .single()
        therapist = therapistData
      }

      return reply.send({ user: userRecord, guardian, therapist })
    } catch (error: any) {
      app.log.error(error)
      reply.status(500).send({ error: error.message || 'Internal server error' })
    }
  })
}
