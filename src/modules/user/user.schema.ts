// user.schema.ts
import { z } from 'zod';
import { PersonResponseSchema } from '../person/person.schema';

export const CreateUserBodySchema = z.object({
  username: z.string().min(1),
  password: z.string().min(6),
  status: z.boolean().default(true),
  personId: z.number(),
});

export const GetUserParamsSchema = z.object({
  id: z.string().transform(Number),
});

export const UserResponseSchema = z.object({
  id: z.number(),
  username: z.string(),
  status: z.boolean(),
  person: PersonResponseSchema.optional(),
});

export type CreateUserBody = z.infer<typeof CreateUserBodySchema>;
export type GetUserParams = z.infer<typeof GetUserParamsSchema>;
export type UserResponse = z.infer<typeof UserResponseSchema>;
