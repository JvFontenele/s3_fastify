import z from 'zod';

export const CreateFileInputSchema = z.object({
  buffer: z.instanceof(Buffer),
  originalName: z.string().min(1),
  mimeType: z.string().min(1),
  size: z.number().min(1),
  personId: z.number(),
  folderId: z.number().optional(),
});

const CreateFileInputStream = z.object({
  stream: z.any(),
  originalName: z.string().min(1),
  mimeType: z.string().min(1),
  personId: z.number(),
  folderId: z.number().optional(),
});

export const FileUploadSchema = z.any().describe('Arquivo a ser enviado');

export const GetFileParamsSchema = z.object({
  id: z.string().transform(Number),
});

export const GetFileByAccessKeyParamsSchema = z.object({
  accessKey: z.string().min(8),
});

export const FileListQuerySchema = z.object({
  folderId: z.coerce.number().int().optional(),
});

export const UpdateFileVisibilityBodySchema = z.object({
  isPublic: z.boolean(),
});

export const ShareFileBodySchema = z.object({
  email: z.string().email(),
});

export const FileShareResponseSchema = z.object({
  email: z.string().email(),
  createdAt: z.date(),
});

export const FileResponseSchema = z.object({
  id: z.number(),
  fileName: z.string(),
  fileUrl: z.string(),
  mimeType: z.string(),
  isPublic: z.boolean(),
  size: z.bigint().transform((data) => {
    return data.toString()
  }),
  folderId: z.number().nullable(),
});

export type CreateFileInput = z.infer<typeof CreateFileInputSchema>;
export type CreateFileInputStream = z.infer<typeof CreateFileInputStream>;
export type GetFileParams = z.infer<typeof GetFileParamsSchema>;
export type GetFileByAccessKeyParams = z.infer<typeof GetFileByAccessKeyParamsSchema>;
export type FileResponse = z.infer<typeof FileResponseSchema>;
export type FileListQuery = z.infer<typeof FileListQuerySchema>;
export type UpdateFileVisibilityBody = z.infer<typeof UpdateFileVisibilityBodySchema>;
export type ShareFileBody = z.infer<typeof ShareFileBodySchema>;
