import { PrismaClientKnownRequestError } from './../../../prisma/generated/internal/prismaNamespace';


export interface HttpError {
  statusCode: number;
  message: string;
  code?: string;
}

export function prismaErrorToHttp(error: unknown): HttpError {
  if (error instanceof PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        return {
          statusCode: 409,
          message: `Já existe um registro com este ${error.meta?.target}`,
          code: error.code,
        };

      case 'P2025':
        return {
          statusCode: 404,
          message: 'Registro não encontrado',
          code: error.code,
        };

      case 'P2003':
        return {
          statusCode: 400,
          message: 'Relacionamento inválido (chave estrangeira)',
          code: error.code,
        };

      case 'P1001':
        return {
          statusCode: 503,
          message: 'Banco de dados indisponível',
          code: error.code,
        };
    }
  }

  return {
    statusCode: 500,
    message: 'Erro interno do servidor',
  };
}
