// auth.schema.ts
import { email, z } from 'zod';
import { UserResponseSchema } from '../user/user.schema';

export const LoginAuthBodySchema = z.object({
  email: z.string(),
  password: z.string().min(6),
});

export const AuthResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string().optional(),
  user: UserResponseSchema,
});

export type LoginAuthBody = z.infer<typeof LoginAuthBodySchema>;
export type AuthResponse = z.infer<typeof AuthResponseSchema>;
