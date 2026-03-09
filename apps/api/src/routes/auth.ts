import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  full_name: z.string().min(2),
  role: z.enum(['guardian', 'therapist']),
  phone: z.string().optional(),
  country_code: z.string().length(2).default('AR'),
});

export default async function authRoutes(app: FastifyInstance) {
  app.post('/auth/register', async (request, reply) => {
    const body = RegisterSchema.parse(request.body);
    // Supabase auth signup handled client-side via Supabase SDK
    // This endpoint creates the user profile after auth
    return reply.code(201).send({ message: 'Registration endpoint — implement with Supabase Auth' });
  });

  app.post('/auth/login', async (request, reply) => {
    return reply.send({ message: 'Login handled by Supabase Auth client SDK' });
  });
}
