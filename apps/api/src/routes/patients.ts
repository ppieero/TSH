import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { supabaseAdmin } from '../server.js'
import { authenticate } from '../middleware/auth.js'

const CreatePatientSchema = z.object({
  first_name: z.string().min(1),
  birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  gender: z.string().optional(),
  native_language: z.string().default('es'),
  can_read: z.boolean(),
  notes: z.string().optional(),
})

const UpdatePatientSchema = z.object({
  first_name: z.string().min(1).optional(),
  birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  gender: z.string().optional(),
  native_language: z.string().optional(),
  can_read: z.boolean().optional(),
  notes: z.string().optional(),
})

async function getGuardianId(userId: string): Promise<string | null> {
  const { data, error } = await supabaseAdmin
    .from('guardians')
    .select('id')
    .eq('user_id', userId)
    .single()
  if (error || !data) return null
  return data.id
}

export default async function patientRoutes(app: FastifyInstance) {
  // GET /patients
  app.get('/', { preHandler: authenticate }, async (request, reply) => {
    try {
      const userId = (request as any).userId
      const guardianId = await getGuardianId(userId)
      if (!guardianId) {
        return reply.status(403).send({ error: 'No guardian profile found' })
      }

      const { data: patients, error } = await supabaseAdmin
        .from('patients')
        .select('*')
        .eq('guardian_id', guardianId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      if (error) {
        return reply.status(500).send({ error: error.message })
      }

      return reply.send({ patients: patients || [] })
    } catch (error: any) {
      app.log.error(error)
      reply.status(500).send({ error: error.message || 'Internal server error' })
    }
  })

  // POST /patients
  app.post('/', { preHandler: authenticate }, async (request, reply) => {
    try {
      const userId = (request as any).userId
      const body = CreatePatientSchema.parse(request.body)

      const guardianId = await getGuardianId(userId)
      if (!guardianId) {
        return reply.status(403).send({ error: 'No guardian profile found' })
      }

      const { data: patient, error } = await supabaseAdmin
        .from('patients')
        .insert({
          guardian_id: guardianId,
          first_name: body.first_name,
          birth_date: body.birth_date,
          gender: body.gender,
          native_language: body.native_language,
          can_read: body.can_read,
          notes: body.notes,
        })
        .select()
        .single()

      if (error) {
        return reply.status(500).send({ error: error.message })
      }

      return reply.status(201).send({ patient })
    } catch (error: any) {
      app.log.error(error)
      if (error.name === 'ZodError') {
        return reply.status(400).send({ error: 'Validation error', details: error.errors })
      }
      reply.status(500).send({ error: error.message || 'Internal server error' })
    }
  })

  // GET /patients/:id
  app.get('/:id', { preHandler: authenticate }, async (request, reply) => {
    try {
      const userId = (request as any).userId
      const { id } = request.params as { id: string }

      const guardianId = await getGuardianId(userId)
      if (!guardianId) {
        return reply.status(403).send({ error: 'No guardian profile found' })
      }

      const { data: patient, error } = await supabaseAdmin
        .from('patients')
        .select('*')
        .eq('id', id)
        .eq('guardian_id', guardianId)
        .is('deleted_at', null)
        .single()

      if (error || !patient) {
        return reply.status(404).send({ error: 'Patient not found' })
      }

      return reply.send({ patient })
    } catch (error: any) {
      app.log.error(error)
      reply.status(500).send({ error: error.message || 'Internal server error' })
    }
  })

  // PUT /patients/:id
  app.put('/:id', { preHandler: authenticate }, async (request, reply) => {
    try {
      const userId = (request as any).userId
      const { id } = request.params as { id: string }
      const body = UpdatePatientSchema.parse(request.body)

      const guardianId = await getGuardianId(userId)
      if (!guardianId) {
        return reply.status(403).send({ error: 'No guardian profile found' })
      }

      // Verify ownership
      const { data: existing } = await supabaseAdmin
        .from('patients')
        .select('id')
        .eq('id', id)
        .eq('guardian_id', guardianId)
        .is('deleted_at', null)
        .single()

      if (!existing) {
        return reply.status(404).send({ error: 'Patient not found' })
      }

      const { data: patient, error } = await supabaseAdmin
        .from('patients')
        .update(body)
        .eq('id', id)
        .eq('guardian_id', guardianId)
        .select()
        .single()

      if (error) {
        return reply.status(500).send({ error: error.message })
      }

      return reply.send({ patient })
    } catch (error: any) {
      app.log.error(error)
      if (error.name === 'ZodError') {
        return reply.status(400).send({ error: 'Validation error', details: error.errors })
      }
      reply.status(500).send({ error: error.message || 'Internal server error' })
    }
  })

  // DELETE /patients/:id (soft delete)
  app.delete('/:id', { preHandler: authenticate }, async (request, reply) => {
    try {
      const userId = (request as any).userId
      const { id } = request.params as { id: string }

      const guardianId = await getGuardianId(userId)
      if (!guardianId) {
        return reply.status(403).send({ error: 'No guardian profile found' })
      }

      // Verify ownership
      const { data: existing } = await supabaseAdmin
        .from('patients')
        .select('id')
        .eq('id', id)
        .eq('guardian_id', guardianId)
        .is('deleted_at', null)
        .single()

      if (!existing) {
        return reply.status(404).send({ error: 'Patient not found' })
      }

      const { error } = await supabaseAdmin
        .from('patients')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)
        .eq('guardian_id', guardianId)

      if (error) {
        return reply.status(500).send({ error: error.message })
      }

      return reply.send({ success: true })
    } catch (error: any) {
      app.log.error(error)
      reply.status(500).send({ error: error.message || 'Internal server error' })
    }
  })
}
