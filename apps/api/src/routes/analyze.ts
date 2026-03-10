import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import axios from 'axios'
import { supabaseAdmin } from '../server.js'
import { authenticate } from '../middleware/auth.js'

const AnalyzeSchema = z.object({
  recording_id: z.string().uuid(),
  session_id: z.string().uuid(),
  item_id: z.string().uuid(),
})

export default async function analyzeRoutes(app: FastifyInstance) {
  // POST /analyze — trigger AI analysis for a recording
  app.post('/', { preHandler: authenticate }, async (request, reply) => {
    try {
      const body = AnalyzeSchema.parse(request.body)

      // Get recording from DB
      const { data: recording, error: recordingError } = await supabaseAdmin
        .from('session_recordings')
        .select('*')
        .eq('id', body.recording_id)
        .single()

      if (recordingError || !recording) {
        return reply.status(404).send({ error: 'Recording not found' })
      }

      // Get the evaluation item (target_word)
      const { data: item, error: itemError } = await supabaseAdmin
        .from('evaluation_items')
        .select('*')
        .eq('id', body.item_id)
        .single()

      if (itemError || !item) {
        return reply.status(404).send({ error: 'Evaluation item not found' })
      }

      // Get session for age_months
      const { data: session, error: sessionError } = await supabaseAdmin
        .from('evaluation_sessions')
        .select('age_months')
        .eq('id', body.session_id)
        .single()

      if (sessionError || !session) {
        return reply.status(404).send({ error: 'Session not found' })
      }

      // Get signed URL for audio from Supabase Storage (15 min TTL)
      const { data: signedUrlData, error: signedUrlError } = await supabaseAdmin.storage
        .from('recordings')
        .createSignedUrl(recording.storage_path, 900) // 15 minutes

      if (signedUrlError || !signedUrlData?.signedUrl) {
        return reply.status(500).send({ error: 'Failed to generate signed URL' })
      }

      // Call voice-ai service
      const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000'
      const aiResponse = await axios.post(`${aiServiceUrl}/analyze-full`, {
        recording_id: recording.id,
        storage_path: recording.storage_path,
        signed_url: signedUrlData.signedUrl,
        target_word: item.target_word,
        age_months: session.age_months,
      }, { timeout: 60000 })

      const analysisData = aiResponse.data

      // Save ai_analysis to DB
      const { data: analysis, error: analysisError } = await supabaseAdmin
        .from('ai_analyses')
        .upsert({
          recording_id: recording.id,
          transcribed: analysisData.transcribed,
          match: analysisData.match,
          deviations: analysisData.deviations || [],
          diagnosis_codes: analysisData.diagnosis_codes || [],
          confidence: analysisData.confidence,
          audio_quality: analysisData.audio_quality || 'good',
          model_version: analysisData.model_version || 'gpt-4o',
          processed_at: new Date().toISOString(),
        }, { onConflict: 'recording_id' })
        .select()
        .single()

      if (analysisError) {
        return reply.status(500).send({ error: analysisError.message })
      }

      return reply.send({ analysis })
    } catch (error: any) {
      app.log.error(error)
      if (error.name === 'ZodError') {
        return reply.status(400).send({ error: 'Validation error', details: error.errors })
      }
      if (axios.isAxiosError(error)) {
        return reply.status(502).send({ error: 'AI service unavailable', details: error.message })
      }
      reply.status(500).send({ error: error.message || 'Internal server error' })
    }
  })
}
