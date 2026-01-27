import z from 'zod';

export const CreateFileInputSchema = z.object({
  buffer: z.instanceof(Buffer),
  originalName: z.string().min(1),
  mimeType: z.string().min(1),
  size: z.number().min(1),
  personId: z.number(),
});

export const FileUploadSchema = z.any().describe('Arquivo a ser enviado')

export const GetFileParamsSchema = z.object({
  personId: z.string().transform(Number),
});

export const FileResponseSchema = z.object({
  id: z.number(),
  fileName: z.string(),
  fileUrl: z.string(),
});

export type CreateFileInput = z.infer<typeof CreateFileInputSchema>;
export type GetFileParams = z.infer<typeof GetFileParamsSchema>;
export type FileResponse = z.infer<typeof FileResponseSchema>;

