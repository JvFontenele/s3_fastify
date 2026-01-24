// user.schema.ts
import { z } from 'zod';



export const CreateUserBodySchema = z.object({
  username: z.string().min(1),
  email: z.email(),
});

export const GetUserParamsSchema = z.object({
  id: z.string().transform(Number),
});

export const UserResponseSchema = z.object({
  id: z.number(),
  username: z.string(),
  email: z.string(),
});

export type CreateUserBody = z.infer<typeof CreateUserBodySchema>;
export type GetUserParams = z.infer<typeof GetUserParamsSchema>;
