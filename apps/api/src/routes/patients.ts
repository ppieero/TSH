import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

const CreatePatientSchema = z.object({
  first_name: z.string().min(1),
  birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  gender: z.string().optional(),
  native_language: z.string().default('es'),
  notes: z.string().optional(),
});

export default async function patientRoutes(app: FastifyInstance) {
  // GET /patients
  app.get('/', async (request, reply) => {
    return reply.send({ patients: [], message: 'Implement with Supabase RLS query' });
  });

  // POST /patients
  app.post('/', async (request, reply) => {
    const body = CreatePatientSchema.parse(request.body);
    return reply.code(201).send({ patient: body, message: 'Implement with Supabase insert' });
  });

  // GET /patients/:id
  app.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    return reply.send({ id, message: 'Implement with Supabase query' });
  });
}
