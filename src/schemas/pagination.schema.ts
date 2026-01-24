import { z } from 'zod';

export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;


export const PaginatedResponseSchema = <T extends z.ZodTypeAny>(data: T) =>
  z.object({
    data,
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  });
