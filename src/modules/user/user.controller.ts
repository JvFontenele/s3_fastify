// user.controller.ts
import type { FastifyReply, FastifyRequest } from 'fastify';
import { BaseController } from '@/shared/BaseController';
import { UserService } from './user.service';
import type { CreateUserBody } from './user.schema';

export class UserController extends BaseController<UserService> {
  postUser = async (request: FastifyRequest<{ Body: CreateUserBody }>, reply: FastifyReply) => {
    const user = await this.service.create(request.body);
    return this.created(reply, user);
  };

  getAllUsers = async (_request: FastifyRequest, reply: FastifyReply) => {
    const users = await this.service.findAll();
    return this.ok(reply, users);
  };

  getUserById = async (request: FastifyRequest<{ Params: { id: number } }>, reply: FastifyReply) => {
    const user = await this.service.findById(request.params.id);
    return this.ok(reply, user);
  };

  deleteUser = async (request: FastifyRequest<{ Params: { id: number } }>, reply: FastifyReply) => {
    const user = await this.service.delete(request.params.id);
    return this.noContent(reply);
  };
}
