import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { supabaseAdmin } from '../server.js'
import { authenticate } from '../middleware/auth.js'
import { generateReport, DISCLAIMER_ES } from '@voicecheck/diagnosis-engine'
import type { AIAnalysis } from '@voicecheck/types'

const ReviewSchema = z.object({
  therapist_notes: z.string().min(1),
})

async function getGuardianId(userId: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from('guardians')
    .select('id')
    .eq('user_id', userId)
    .single()
  return data?.id || null
}

async function getTherapistId(userId: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from('therapists')
    .select('id')
    .eq('user_id', userId)
    .single()
  return data?.id || null
}

export default async function reportRoutes(app: FastifyInstance) {
  // GET /reports/therapist/all — get all reports (therapist role)
  app.get('/therapist/all', { preHandler: authenticate }, async (request, reply) => {
    try {
      const userId = (request as any).userId

      // Check role
      const { data: userRecord } = await supabaseAdmin
        .from('users')
        .select('role')
        .eq('id', userId)
        .single()

      if (!userRecord || !['therapist', 'admin'].includes(userRecord.role)) {
        return reply.status(403).send({ error: 'Access denied: therapist role required' })
      }

      const { data: reports, error } = await supabaseAdmin
        .from('prediagnosis_reports')
        .select(`
          *,
          evaluation_sessions(
            *,
            patients(first_name, birth_date)
          )
        `)
        .order('generated_at', { ascending: false })

      if (error) {
        return reply.status(500).send({ error: error.message })
      }

      return reply.send({ reports: reports || [] })
    } catch (error: any) {
      app.log.error(error)
      reply.status(500).send({ error: error.message || 'Internal server error' })
    }
  })

  // GET /reports/:sessionId — generate or retrieve report
  app.get('/:sessionId', { preHandler: authenticate }, async (request, reply) => {
    try {
      const userId = (request as any).userId
      const { sessionId } = request.params as { sessionId: string }

      // Verify access: either guardian of session or therapist
      const { data: userRecord } = await supabaseAdmin
        .from('users')
        .select('role')
        .eq('id', userId)
        .single()

      if (!userRecord) {
        return reply.status(403).send({ error: 'User not found' })
      }

      let session: any = null
      if (userRecord.role === 'guardian') {
        const guardianId = await getGuardianId(userId)
        if (!guardianId) {
          return reply.status(403).send({ error: 'No guardian profile found' })
        }
        const { data: sessionData, error: sessionError } = await supabaseAdmin
          .from('evaluation_sessions')
          .select('*, patients(*)')
          .eq('id', sessionId)
          .eq('guardian_id', guardianId)
          .single()

        if (sessionError || !sessionData) {
          return reply.status(404).send({ error: 'Session not found' })
        }
        session = sessionData
      } else {
        // therapist or admin can access any session
        const { data: sessionData, error: sessionError } = await supabaseAdmin
          .from('evaluation_sessions')
          .select('*, patients(*)')
          .eq('id', sessionId)
          .single()

        if (sessionError || !sessionData) {
          return reply.status(404).send({ error: 'Session not found' })
        }
        session = sessionData
      }

      const patient = session.patients

      // Check if report exists
      const { data: existingReport } = await supabaseAdmin
        .from('prediagnosis_reports')
        .select('*')
        .eq('session_id', sessionId)
        .single()

      let report: any = existingReport

      if (!report) {
        // Generate report
        // a. Get all recordings for session
        const { data: recordings, error: recordingsError } = await supabaseAdmin
          .from('session_recordings')
          .select('*')
          .eq('session_id', sessionId)

        if (recordingsError) {
          return reply.status(500).send({ error: recordingsError.message })
        }

        const recordingsList = recordings || []

        // b. Get all ai_analyses for those recordings
        let analysesList: AIAnalysis[] = []
        if (recordingsList.length > 0) {
          const recordingIds = recordingsList.map((r: any) => r.id)
          const { data: analyses, error: analysesError } = await supabaseAdmin
            .from('ai_analyses')
            .select('*')
            .in('recording_id', recordingIds)

          if (analysesError) {
            return reply.status(500).send({ error: analysesError.message })
          }
          analysesList = (analyses || []) as AIAnalysis[]
        }

        // c. Call generateReport()
        const reportData = generateReport(sessionId, analysesList)

        // d. Save to prediagnosis_reports
        const { data: newReport, error: reportError } = await supabaseAdmin
          .from('prediagnosis_reports')
          .insert({
            session_id: sessionId,
            patterns_found: reportData.patterns_found,
            severity_level: reportData.severity_level,
            score_overall: reportData.score_overall,
            scores_by_category: reportData.scores_by_category,
            summary_es: reportData.summary_es,
            recommendation: reportData.recommendation,
            generated_at: reportData.generated_at,
          })
          .select()
          .single()

        if (reportError) {
          return reply.status(500).send({ error: reportError.message })
        }

        // Update session status to 'reported'
        await supabaseAdmin
          .from('evaluation_sessions')
          .update({ status: 'reported' })
          .eq('id', sessionId)

        report = newReport
      }

      // Get all recordings and analyses for the response
      const { data: allRecordings } = await supabaseAdmin
        .from('session_recordings')
        .select('*')
        .eq('session_id', sessionId)

      const recordingsList = allRecordings || []
      let analysesList: any[] = []
      let itemsList: any[] = []

      if (recordingsList.length > 0) {
        const recordingIds = recordingsList.map((r: any) => r.id)
        const itemIds = [...new Set(recordingsList.map((r: any) => r.item_id))]

        const [{ data: analyses }, { data: items }] = await Promise.all([
          supabaseAdmin.from('ai_analyses').select('*').in('recording_id', recordingIds),
          supabaseAdmin.from('evaluation_items').select('*').in('id', itemIds),
        ])

        analysesList = analyses || []
        itemsList = items || []
      }

      return reply.send({
        report,
        session: { ...session, patients: undefined },
        patient,
        items: itemsList,
        recordings: recordingsList,
        analyses: analysesList,
        disclaimer: DISCLAIMER_ES,
      })
    } catch (error: any) {
      app.log.error(error)
      reply.status(500).send({ error: error.message || 'Internal server error' })
    }
  })

  // PUT /reports/:id/review — therapist adds notes
  app.put('/:id/review', { preHandler: authenticate }, async (request, reply) => {
    try {
      const userId = (request as any).userId
      const { id } = request.params as { id: string }
      const body = ReviewSchema.parse(request.body)

      // Verify user has therapist role
      const { data: userRecord } = await supabaseAdmin
        .from('users')
        .select('role')
        .eq('id', userId)
        .single()

      if (!userRecord || !['therapist', 'admin'].includes(userRecord.role)) {
        return reply.status(403).send({ error: 'Access denied: therapist role required' })
      }

      // Get therapist record
      const therapistId = await getTherapistId(userId)
      if (!therapistId) {
        return reply.status(403).send({ error: 'No therapist profile found' })
      }

      // Get the report to find session_id
      const { data: reportData } = await supabaseAdmin
        .from('prediagnosis_reports')
        .select('session_id')
        .eq('id', id)
        .single()

      if (!reportData) {
        return reply.status(404).send({ error: 'Report not found' })
      }

      // Update report
      const { data: report, error: reportError } = await supabaseAdmin
        .from('prediagnosis_reports')
        .update({
          reviewed_by: therapistId,
          reviewed_at: new Date().toISOString(),
          therapist_notes: body.therapist_notes,
        })
        .eq('id', id)
        .select()
        .single()

      if (reportError) {
        return reply.status(500).send({ error: reportError.message })
      }

      // Update session status to 'reviewed'
      await supabaseAdmin
        .from('evaluation_sessions')
        .update({ status: 'reviewed' })
        .eq('id', reportData.session_id)

      return reply.send({ report })
    } catch (error: any) {
      app.log.error(error)
      if (error.name === 'ZodError') {
        return reply.status(400).send({ error: 'Validation error', details: error.errors })
      }
      reply.status(500).send({ error: error.message || 'Internal server error' })
    }
  })
}
