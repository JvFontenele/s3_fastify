// person.controller.ts
import type { FastifyReply, FastifyRequest } from 'fastify';
import { BaseController } from '@/shared/BaseController';
import { PersonService } from './person.service';
import { CreatePersonBody } from './person.schema';

export class PersonController extends BaseController {
  constructor(private readonly service: PersonService) {
    super();
  }
  postPerson = async (request: FastifyRequest<{ Body: CreatePersonBody }>, reply: FastifyReply) => {
    const person = await this.service.create(request.body);
    return this.created(reply, person);
  };

  postPersonPublic = async (request: FastifyRequest<{ Body: CreatePersonBody }>, reply: FastifyReply) => {
    const existPerson = await this.service.findByCPF_CNPJ(request.body.cpfCnpj);
    if (existPerson) {
      return this.ok(reply, existPerson);
    }

    const person = await this.service.create(request.body);

    return this.created(reply, person);
  };

  getAllPersons = async (request: FastifyRequest, reply: FastifyReply) => {
    const { page, limit, skip, take } = this.getPagination(request);
    const { data, total } = await this.service.findAll({
      skip,
      take,
    });
    return this.paginated(reply, data, total, page, limit);
  };

  getPersonById = async (request: FastifyRequest<{ Params: { id: number } }>, reply: FastifyReply) => {
    const person = await this.service.findById(request.params.id);
    return this.ok(reply, person);
  };

  deletePerson = async (request: FastifyRequest<{ Params: { id: number } }>, reply: FastifyReply) => {
    const person = await this.service.delete(request.params.id);
    return this.noContent(reply);
  };
}
