import { BaseController } from '@/shared/BaseController';
import { FileService } from './file.service';
import { FastifyReply, FastifyRequest } from 'fastify';
import { BadRequestError, NotFoundError } from '@/shared/errors/http-error';

export class FileController extends BaseController {
  constructor(private readonly service: FileService) {
    super();
  }

  upload = async (request: FastifyRequest, reply: FastifyReply) => {
    const file = await request.file();

    if (!file) {
      return new BadRequestError('File is required');
    }

    const buffer = await file.toBuffer();
    const saved = await this.service.upload({
      buffer,
      originalName: file.filename,
      mimeType: file.mimetype,
      size: file.file.truncated ? 0 : buffer.length,
      personId: Number(request.user.person.id),
    });

    return this.created(reply, saved);
  };

  findByPerson = async (request: FastifyRequest, reply: FastifyReply) => {
    const files = await this.service.findFilesByPersonId(request.user.person.id);

    if (!files) {
      throw new NotFoundError('Files not found');
    }

    return files;
  };
}
