import type { FastifyInstance } from 'fastify';

export default async function sessionRoutes(app: FastifyInstance) {
  // POST /sessions — start new evaluation session
  app.post('/', async (request, reply) => {
    return reply.code(201).send({ message: 'Start session — implement with Supabase' });
  });

  // GET /sessions/:id
  app.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    return reply.send({ id, message: 'Get session — implement with Supabase' });
  });

  // POST /sessions/:id/recordings — upload recording metadata
  app.post('/:id/recordings', async (request, reply) => {
    return reply.code(201).send({ message: 'Create recording — implement with Supabase Storage' });
  });

  // GET /sessions/:id/next-item — get next evaluation item
  app.get('/:id/next-item', async (request, reply) => {
    return reply.send({ message: 'Get next item — implement with age-based query' });
  });
}
