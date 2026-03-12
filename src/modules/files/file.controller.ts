import { BaseController } from '@/shared/BaseController';
import { FileService } from './file.service.js';
import { FastifyReply, FastifyRequest } from 'fastify';
import { BadRequestError } from '@/shared/errors/http-error';
import { ShareFileBody, UpdateFileVisibilityBody } from './file.schema.js';

export class FileController extends BaseController {
  constructor(private readonly service: FileService) {
    super();
  }

  private parseFolderId(request: FastifyRequest, file?: { fields?: Record<string, { value?: string }> }) {
    const raw =
      file?.fields?.folderId?.value ??
      (request.query as { folderId?: string | number } | undefined)?.folderId;

    if (raw === undefined) return undefined;

    const parsed = Number(raw);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      throw new BadRequestError('folderId inválido.');
    }

    return parsed;
  }

  upload = async (request: FastifyRequest, reply: FastifyReply) => {
    const file = await request.file();

    if (!file) {
      return new BadRequestError('O arquivo é Obrigatório.');
    }

    const folderId = this.parseFolderId(request, file as { fields?: Record<string, { value?: string }> });
    const buffer = await file.toBuffer();
    const saved = await this.service.upload({
      buffer,
      originalName: file.filename,
      mimeType: file.mimetype,
      size: file.file.truncated ? 0 : buffer.length,
      personId: Number(request.user.person.id),
      folderId,
    });

    return this.created(reply, saved);
  };

  uploadStream = async (request: FastifyRequest, reply: FastifyReply) => {
    const file = await request.file();

    if (!file) {
      return new BadRequestError('O arquivo é Obrigatório.');
    }

    const folderId = this.parseFolderId(request, file as { fields?: Record<string, { value?: string }> });
    const saved = await this.service.uploadStream({
      stream: file.file,
      originalName: file.filename,
      mimeType: file.mimetype,
      personId: Number(request.user.person.id),
      folderId,
    });

    return this.created(reply, saved);
  };

  findByPerson = async (request: FastifyRequest, reply: FastifyReply) => {
    const { page, limit, skip, take } = this.getPagination(request);
    const folderId = this.parseFolderId(request);

    const { data, total } = await this.service.findFilesByPersonId(request.user.person.id, {
      skip,
      take,
      folderId,
    });

    return this.paginated(reply, data, total, page, limit);
  };

  delete = async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: number };

    await this.service.delete(id, request.user.person.id);

    return this.noContent(reply);
  };

  updateVisibility = async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: number };
    const body = request.body as UpdateFileVisibilityBody;
    const result = await this.service.setFileVisibility(id, request.user.person.id, body.isPublic);

    return this.ok(reply, result);
  };

  shareByEmail = async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: number };
    const body = request.body as ShareFileBody;
    const result = await this.service.addShareByEmail(id, request.user.person.id, body.email);
    return this.created(reply, result);
  };

  unshareByEmail = async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: number };
    const body = request.body as ShareFileBody;
    await this.service.removeShareByEmail(id, request.user.person.id, body.email);
    return this.noContent(reply);
  };

  listShares = async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: number };
    const result = await this.service.listShares(id, request.user.person.id);
    return this.ok(reply, result);
  };

  accessByKey = async (request: FastifyRequest, reply: FastifyReply) => {
    const viewerPersonId = request.user?.person?.id;
    const { accessKey } = request.params as { accessKey: string };
    const { stream, fileName, mimeType } = await this.service.getFileContentByAccessKey(accessKey, viewerPersonId);

    reply.header('Content-Type', mimeType);
    reply.header('Content-Disposition', `inline; filename=\"${encodeURIComponent(fileName)}\"`);
    return reply.send(stream);
  };
}
