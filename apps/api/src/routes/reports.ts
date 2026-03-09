import type { FastifyInstance } from 'fastify';
import { DISCLAIMER_ES } from '@voicecheck/diagnosis-engine';

export default async function reportRoutes(app: FastifyInstance) {
  // GET /reports/:sessionId
  app.get('/:sessionId', async (request, reply) => {
    const { sessionId } = request.params as { sessionId: string };
    return reply.send({
      sessionId,
      disclaimer: DISCLAIMER_ES,
      message: 'Get report — implement with Supabase query + generateReport()',
    });
  });
}
