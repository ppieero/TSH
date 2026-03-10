import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { supabaseAdmin } from '../server.js'

const LanguageRequestSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  language_requested: z.string().min(1),
  country: z.string().min(1),
})

export default async function languageRequestRoutes(app: FastifyInstance) {
  // POST /language-requests — save language request (no auth needed)
  app.post('/', async (request, reply) => {
    try {
      const body = LanguageRequestSchema.parse(request.body)

      const { data, error } = await supabaseAdmin
        .from('language_requests')
        .insert({
          name: body.name,
          email: body.email,
          language_requested: body.language_requested,
          country: body.country,
        })
        .select()
        .single()

      if (error) {
        return reply.status(500).send({ error: error.message })
      }

      return reply.status(201).send({ success: true, id: data.id })
    } catch (error: any) {
      app.log.error(error)
      if (error.name === 'ZodError') {
        return reply.status(400).send({ error: 'Validation error', details: error.errors })
      }
      reply.status(500).send({ error: error.message || 'Internal server error' })
    }
  })

  // GET /language-requests — list all (admin only, no auth for simplicity in dev)
  app.get('/', async (request, reply) => {
    try {
      const { data, error } = await supabaseAdmin
        .from('language_requests')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        return reply.status(500).send({ error: error.message })
      }

      return reply.send({ language_requests: data || [] })
    } catch (error: any) {
      app.log.error(error)
      reply.status(500).send({ error: error.message || 'Internal server error' })
    }
  })
}
