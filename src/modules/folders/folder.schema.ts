import z from 'zod';
import { PaginationQuerySchema } from '@/schemas/pagination.schema';

const FolderNameSchema = z
  .string()
  .min(1)
  .max(255)
  .refine((name) => !/[\\/]/.test(name), {
    message: 'O nome da pasta não pode conter "/" ou "\\".',
  });

export const CreateFolderBodySchema = z.object({
  name: FolderNameSchema,
  parentId: z.number().int().positive().optional(),
  allowedTypes: z.array(z.string().min(1)).optional(),
});

export const UpdateFolderBodySchema = z.object({
  name: FolderNameSchema.optional(),
  allowedTypes: z.array(z.string().min(1)).optional(),
});

export const GetFolderParamsSchema = z.object({
  id: z.string().transform(Number),
});

export const FolderListQuerySchema = PaginationQuerySchema.merge(
  z.object({
    parentId: z.coerce.number().int().optional(),
  }),
);

export const FolderResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  path: z.string(),
  parentId: z.number().nullable(),
  allowedTypes: z.array(z.string()),
});

export type CreateFolderBody = z.infer<typeof CreateFolderBodySchema>;
export type UpdateFolderBody = z.infer<typeof UpdateFolderBodySchema>;
export type GetFolderParams = z.infer<typeof GetFolderParamsSchema>;
export type FolderListQuery = z.infer<typeof FolderListQuerySchema>;
export type FolderResponse = z.infer<typeof FolderResponseSchema>;
