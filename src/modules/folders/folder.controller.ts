import { BaseController } from '@/shared/BaseController';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { BadRequestError } from '@/shared/errors/http-error';
import type { CreateFolderBody } from './folder.schema';
import { FolderService } from './folder.service';

export class FolderController extends BaseController {
  constructor(private readonly service: FolderService) {
    super();
  }

  create = async (request: FastifyRequest<{ Body: CreateFolderBody }>, reply: FastifyReply) => {
    const folder = await this.service.createFolder({
      ...request.body,
      personId: Number(request.user.person.id),
    });

    return this.created(reply, folder);
  };

  list = async (request: FastifyRequest, reply: FastifyReply) => {
    const { page, limit, skip, take } = this.getPagination(request);
    const { parentId } = request.query as { parentId?: string | number };

    if (parentId !== undefined && (!Number.isFinite(Number(parentId)) || Number(parentId) <= 0)) {
      throw new BadRequestError('parentId inválido.');
    }

    const { data, total } = await this.service.listFolders(request.user.person.id, {
      skip,
      take,
      parentId: parentId === undefined ? undefined : Number(parentId),
    });

    return this.paginated(reply, data, total, page, limit);
  };

  delete = async (request: FastifyRequest<{ Params: { id: number } }>, reply: FastifyReply) => {
    const { id } = request.params;

    await this.service.deleteFolder(id, request.user.person.id);

    return this.noContent(reply);
  };
}
