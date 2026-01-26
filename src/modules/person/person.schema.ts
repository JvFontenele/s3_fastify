// person.schema.ts
import { z } from 'zod';

export const CreatePersonBodySchema = z.object({
  name: z.string().min(1),
  email: z.email(),
  cpfCnpj: z.string().min(11).max(14),
  type: z.enum(['PF', 'PJ']),
});

export const GetPersonParamsSchema = z.object({
  id: z.string().transform(Number),
});

export const PersonResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string(),
  cpfCnpj: z.string(),
  type: z.enum(['PF', 'PJ']),
});

export type CreatePersonBody = z.infer<typeof CreatePersonBodySchema>;
export type GetPersonParams = z.infer<typeof GetPersonParamsSchema>;
export type PersonResponse = z.infer<typeof PersonResponseSchema>;
