import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { supabaseAdmin } from '../server.js'
import { authenticate } from '../middleware/auth.js'

const CreateSessionSchema = z.object({
  patient_id: z.string().uuid(),
  can_read: z.boolean().optional(),
})

const UpdateStatusSchema = z.object({
  status: z.enum(['pending', 'in_progress', 'completed', 'reported', 'reviewed', 'abandoned']),
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

function calculateAgeMonths(birthDate: string): number {
  const birth = new Date(birthDate)
  const now = new Date()
  const years = now.getFullYear() - birth.getFullYear()
  const months = now.getMonth() - birth.getMonth()
  return years * 12 + months
}

export default async function sessionRoutes(app: FastifyInstance) {
  // POST /sessions — create new evaluation session
  app.post('/', { preHandler: authenticate }, async (request, reply) => {
    try {
      const userId = (request as any).userId
      const body = CreateSessionSchema.parse(request.body)

      const guardianId = await getGuardianId(userId)
      if (!guardianId) {
        return reply.status(403).send({ error: 'No guardian profile found' })
      }

      // Verify patient belongs to guardian
      const { data: patient, error: patientError } = await supabaseAdmin
        .from('patients')
        .select('*')
        .eq('id', body.patient_id)
        .eq('guardian_id', guardianId)
        .single()

      if (patientError || !patient) {
        return reply.status(404).send({ error: 'Patient not found or not authorized' })
      }

      // Calculate age in months
      const ageMonths = calculateAgeMonths(patient.birth_date)
      const canRead = body.can_read !== undefined ? body.can_read : patient.can_read

      const { data: session, error: sessionError } = await supabaseAdmin
        .from('evaluation_sessions')
        .insert({
          patient_id: body.patient_id,
          guardian_id: guardianId,
          status: 'pending',
          age_months: ageMonths,
          can_read: canRead,
          started_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (sessionError) {
        return reply.status(500).send({ error: sessionError.message })
      }

      return reply.status(201).send({ session })
    } catch (error: any) {
      app.log.error(error)
      if (error.name === 'ZodError') {
        return reply.status(400).send({ error: 'Validation error', details: error.errors })
      }
      reply.status(500).send({ error: error.message || 'Internal server error' })
    }
  })

  // GET /sessions — get all sessions for guardian
  app.get('/', { preHandler: authenticate }, async (request, reply) => {
    try {
      const userId = (request as any).userId

      const guardianId = await getGuardianId(userId)
      if (!guardianId) {
        return reply.status(403).send({ error: 'No guardian profile found' })
      }

      const { data: sessions, error } = await supabaseAdmin
        .from('evaluation_sessions')
        .select('*, patients(first_name, birth_date)')
        .eq('guardian_id', guardianId)
        .order('created_at', { ascending: false })

      if (error) {
        return reply.status(500).send({ error: error.message })
      }

      return reply.send({ sessions: sessions || [] })
    } catch (error: any) {
      app.log.error(error)
      reply.status(500).send({ error: error.message || 'Internal server error' })
    }
  })

  // GET /sessions/:id — get session details with patient info
  app.get('/:id', { preHandler: authenticate }, async (request, reply) => {
    try {
      const userId = (request as any).userId
      const { id } = request.params as { id: string }

      const guardianId = await getGuardianId(userId)
      if (!guardianId) {
        return reply.status(403).send({ error: 'No guardian profile found' })
      }

      const { data: session, error } = await supabaseAdmin
        .from('evaluation_sessions')
        .select('*, patients(*)')
        .eq('id', id)
        .eq('guardian_id', guardianId)
        .single()

      if (error || !session) {
        return reply.status(404).send({ error: 'Session not found' })
      }

      return reply.send({ session })
    } catch (error: any) {
      app.log.error(error)
      reply.status(500).send({ error: error.message || 'Internal server error' })
    }
  })

  // PUT /sessions/:id/status — update session status
  app.put('/:id/status', { preHandler: authenticate }, async (request, reply) => {
    try {
      const userId = (request as any).userId
      const { id } = request.params as { id: string }
      const body = UpdateStatusSchema.parse(request.body)

      const guardianId = await getGuardianId(userId)
      if (!guardianId) {
        return reply.status(403).send({ error: 'No guardian profile found' })
      }

      // Verify session belongs to guardian
      const { data: existing } = await supabaseAdmin
        .from('evaluation_sessions')
        .select('id')
        .eq('id', id)
        .eq('guardian_id', guardianId)
        .single()

      if (!existing) {
        return reply.status(404).send({ error: 'Session not found' })
      }

      const updateData: any = { status: body.status }
      if (body.status === 'completed') {
        updateData.completed_at = new Date().toISOString()
      }

      const { data: session, error } = await supabaseAdmin
        .from('evaluation_sessions')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        return reply.status(500).send({ error: error.message })
      }

      return reply.send({ session })
    } catch (error: any) {
      app.log.error(error)
      if (error.name === 'ZodError') {
        return reply.status(400).send({ error: 'Validation error', details: error.errors })
      }
      reply.status(500).send({ error: error.message || 'Internal server error' })
    }
  })

  // GET /sessions/:id/next-item — get next evaluation item
  app.get('/:id/next-item', { preHandler: authenticate }, async (request, reply) => {
    try {
      const userId = (request as any).userId
      const { id: sessionId } = request.params as { id: string }

      const guardianId = await getGuardianId(userId)
      if (!guardianId) {
        return reply.status(403).send({ error: 'No guardian profile found' })
      }

      // Get session
      const { data: session, error: sessionError } = await supabaseAdmin
        .from('evaluation_sessions')
        .select('*')
        .eq('id', sessionId)
        .eq('guardian_id', guardianId)
        .single()

      if (sessionError || !session) {
        return reply.status(404).send({ error: 'Session not found' })
      }

      const ageMonths = session.age_months

      // Get all evaluation items for this age range
      const { data: allItems, error: itemsError } = await supabaseAdmin
        .from('evaluation_items')
        .select('*')
        .lte('age_min_months', ageMonths)
        .gte('age_max_months', ageMonths)
        .eq('active', true)
        .order('difficulty_level', { ascending: true })

      if (itemsError) {
        return reply.status(500).send({ error: itemsError.message })
      }

      const items = allItems || []

      // Get already recorded item IDs for this session
      const { data: recordings, error: recordingsError } = await supabaseAdmin
        .from('session_recordings')
        .select('item_id')
        .eq('session_id', sessionId)

      if (recordingsError) {
        return reply.status(500).send({ error: recordingsError.message })
      }

      const completedItemIds = new Set((recordings || []).map((r: any) => r.item_id))

      // Find first item not yet recorded
      const nextItem = items.find((item: any) => !completedItemIds.has(item.id)) || null

      const totalItems = items.length
      const completedItems = items.filter((item: any) => completedItemIds.has(item.id)).length
      const sessionComplete = nextItem === null

      // If session is complete, update status
      if (sessionComplete && session.status === 'in_progress') {
        await supabaseAdmin
          .from('evaluation_sessions')
          .update({ status: 'completed', completed_at: new Date().toISOString() })
          .eq('id', sessionId)
      }

      return reply.send({
        item: nextItem,
        session_complete: sessionComplete,
        total_items: totalItems,
        completed_items: completedItems,
      })
    } catch (error: any) {
      app.log.error(error)
      reply.status(500).send({ error: error.message || 'Internal server error' })
    }
  })
}
