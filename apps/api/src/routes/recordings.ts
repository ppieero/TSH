import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import axios from 'axios'
import { supabaseAdmin } from '../server.js'
import { authenticate } from '../middleware/auth.js'

const SubmitRecordingSchema = z.object({
  item_id: z.string().uuid(),
  audio_base64: z.string().min(1),
  mime_type: z.enum(['audio/webm', 'audio/mp4', 'audio/ogg']),
  duration_ms: z.number().int().positive(),
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

export default async function recordingRoutes(app: FastifyInstance) {
  // POST /sessions/:sessionId/recordings — submit a recording
  app.post('/:sessionId/recordings', { preHandler: authenticate }, async (request, reply) => {
    try {
      const userId = (request as any).userId
      const { sessionId } = request.params as { sessionId: string }
      const body = SubmitRecordingSchema.parse(request.body)

      const guardianId = await getGuardianId(userId)
      if (!guardianId) {
        return reply.status(403).send({ error: 'No guardian profile found' })
      }

      // Verify session belongs to guardian
      const { data: session, error: sessionError } = await supabaseAdmin
        .from('evaluation_sessions')
        .select('*')
        .eq('id', sessionId)
        .eq('guardian_id', guardianId)
        .single()

      if (sessionError || !session) {
        return reply.status(404).send({ error: 'Session not found or not authorized' })
      }

      // Get the evaluation item
      const { data: item, error: itemError } = await supabaseAdmin
        .from('evaluation_items')
        .select('*')
        .eq('id', body.item_id)
        .single()

      if (itemError || !item) {
        return reply.status(404).send({ error: 'Evaluation item not found' })
      }

      // Check how many attempts for this item in this session
      const { data: existingRecordings } = await supabaseAdmin
        .from('session_recordings')
        .select('id, attempt_number')
        .eq('session_id', sessionId)
        .eq('item_id', body.item_id)
        .order('attempt_number', { ascending: false })

      const attemptNumber = existingRecordings && existingRecordings.length > 0
        ? existingRecordings[0].attempt_number + 1
        : 1

      // Decode base64 to Buffer
      const base64Data = body.audio_base64.includes(',')
        ? body.audio_base64.split(',')[1]
        : body.audio_base64
      const buffer = Buffer.from(base64Data, 'base64')

      // Upload to Supabase Storage
      const ext = body.mime_type === 'audio/mp4' ? 'mp4' : body.mime_type === 'audio/ogg' ? 'ogg' : 'webm'
      const fileName = `sessions/${sessionId}/${body.item_id}/${Date.now()}.${ext}`

      const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
        .from('recordings')
        .upload(fileName, buffer, { contentType: body.mime_type, upsert: false })

      if (uploadError) {
        app.log.error('Storage upload error:', uploadError)
        return reply.status(500).send({ error: `Storage upload failed: ${uploadError.message}` })
      }

      // Insert session_recording record
      const { data: recording, error: recordingError } = await supabaseAdmin
        .from('session_recordings')
        .insert({
          session_id: sessionId,
          item_id: body.item_id,
          storage_path: fileName,
          duration_ms: body.duration_ms,
          mime_type: body.mime_type,
          attempt_number: attemptNumber,
        })
        .select()
        .single()

      if (recordingError) {
        return reply.status(500).send({ error: recordingError.message })
      }

      // Update session status to in_progress if still pending
      if (session.status === 'pending') {
        await supabaseAdmin
          .from('evaluation_sessions')
          .update({ status: 'in_progress' })
          .eq('id', sessionId)
      }

      // Trigger AI analysis
      let analysis = null
      try {
        const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000'
        const aiResponse = await axios.post(`${aiServiceUrl}/analyze-full`, {
          recording_id: recording.id,
          storage_path: fileName,
          target_word: item.target_word,
          age_months: session.age_months,
        }, { timeout: 30000 })
        analysis = aiResponse.data
      } catch (aiError: any) {
        app.log.warn('AI analysis failed (non-fatal):', aiError.message)
        // AI analysis failure is non-fatal; continue
      }

      return reply.status(201).send({ recording, analysis })
    } catch (error: any) {
      app.log.error(error)
      if (error.name === 'ZodError') {
        return reply.status(400).send({ error: 'Validation error', details: error.errors })
      }
      reply.status(500).send({ error: error.message || 'Internal server error' })
    }
  })

  // GET /sessions/:sessionId/recordings — list recordings for a session
  app.get('/:sessionId/recordings', { preHandler: authenticate }, async (request, reply) => {
    try {
      const userId = (request as any).userId
      const { sessionId } = request.params as { sessionId: string }

      const guardianId = await getGuardianId(userId)
      if (!guardianId) {
        return reply.status(403).send({ error: 'No guardian profile found' })
      }

      // Verify session belongs to guardian
      const { data: session } = await supabaseAdmin
        .from('evaluation_sessions')
        .select('id')
        .eq('id', sessionId)
        .eq('guardian_id', guardianId)
        .single()

      if (!session) {
        return reply.status(404).send({ error: 'Session not found' })
      }

      const { data: recordings, error } = await supabaseAdmin
        .from('session_recordings')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true })

      if (error) {
        return reply.status(500).send({ error: error.message })
      }

      return reply.send({ recordings: recordings || [] })
    } catch (error: any) {
      app.log.error(error)
      reply.status(500).send({ error: error.message || 'Internal server error' })
    }
  })
}
