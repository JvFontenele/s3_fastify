// auth.schema.ts
import { email, z } from 'zod';

export const LoginAuthBodySchema = z.object({
  email: z.string(),
  password: z.string().min(6),
});

export type LoginAuthBody = z.infer<typeof LoginAuthBodySchema>;
