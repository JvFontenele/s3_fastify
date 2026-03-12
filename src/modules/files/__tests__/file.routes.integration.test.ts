import { Readable } from 'node:stream'
import { describe, expect, it, vi } from 'vitest'
import Fastify from 'fastify'
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod'
import { errorPlugin } from '@/plugins/error-handler.js'
import fileRoutes from '../file.routes.js'

const storageMocks = vi.hoisted(() => ({
  getStream: vi.fn(),
}))

vi.mock('../../storage/storage.service', () => ({
  StorageService: class {
    getStream = storageMocks.getStream
  },
}))

vi.mock('@/hooks/auth', () => ({
  authHook: async (request: any) => {
    request.user = {
      person: { id: 1 },
    }
  },
  optionalAuthHook: async (request: any) => {
    const raw = request.headers['x-user-id']
    if (raw) {
      request.user = {
        person: { id: Number(raw) },
      }
    }
  },
}))

function createPrismaMock() {
  const filesByAccess = new Map<
    string,
    {
      id: number
      personId: number
      isPublic: boolean
      key: string
      fileName: string
      mimeType: string
      shares: Array<{ personId: number }>
    }
  >()

  const prisma = {
    person: {
      findUnique: vi.fn(async () => ({ id: 1 })),
    },
    folder: {
      findFirst: vi.fn(async () => null),
    },
    user: {
      findFirst: vi.fn(async () => null),
    },
    fileShare: {
      upsert: vi.fn(async () => ({})),
      deleteMany: vi.fn(async () => ({ count: 0 })),
      findMany: vi.fn(async () => []),
    },
    file: {
      findUnique: vi.fn(async ({ where }: any) => {
        if (where.accessKey) return filesByAccess.get(where.accessKey) ?? null
        return null
      }),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findMany: vi.fn(async () => []),
      count: vi.fn(async () => 0),
    },
  }

  return { prisma, filesByAccess }
}

describe('file routes integration', () => {
  const buildApp = async () => {
    const app = Fastify()
    app.setValidatorCompiler(validatorCompiler)
    app.setSerializerCompiler(serializerCompiler)
    const mock = createPrismaMock()
    app.decorate('prisma', mock.prisma as any)
    await app.register(errorPlugin)
    await app.register(fileRoutes, { prefix: '/files' })
    await app.ready()
    return { app, mock }
  }

  it('allows public access by accessKey without login token', async () => {
    const { app, mock } = await buildApp()
    mock.filesByAccess.set('public-key', {
      id: 1,
      personId: 10,
      isPublic: true,
      key: '10/public.txt',
      fileName: 'public.txt',
      mimeType: 'text/plain',
      shares: [],
    })
    storageMocks.getStream.mockResolvedValue(Readable.from('public-content'))

    const response = await app.inject({
      method: 'GET',
      url: '/files/access/public-key',
    })

    expect(response.statusCode).toBe(200)
    expect(response.body).toBe('public-content')
    expect(response.headers['content-type']).toContain('text/plain')
    await app.close()
  })

  it('blocks anonymous access for private file', async () => {
    const { app, mock } = await buildApp()
    mock.filesByAccess.set('private-key', {
      id: 2,
      personId: 10,
      isPublic: false,
      key: '10/private.txt',
      fileName: 'private.txt',
      mimeType: 'text/plain',
      shares: [],
    })

    const response = await app.inject({
      method: 'GET',
      url: '/files/access/private-key',
    })

    expect(response.statusCode).toBe(403)
    expect(response.json().message).toBe('Você não tem permissão para acessar este arquivo.')
    await app.close()
  })

  it('allows shared user access for private file', async () => {
    const { app, mock } = await buildApp()
    mock.filesByAccess.set('shared-key', {
      id: 3,
      personId: 10,
      isPublic: false,
      key: '10/shared.txt',
      fileName: 'shared.txt',
      mimeType: 'text/plain',
      shares: [{ personId: 2 }],
    })
    storageMocks.getStream.mockResolvedValue(Readable.from('shared-content'))

    const response = await app.inject({
      method: 'GET',
      url: '/files/access/shared-key',
      headers: {
        'x-user-id': '2',
      },
    })

    expect(response.statusCode).toBe(200)
    expect(response.body).toBe('shared-content')
    await app.close()
  })
})
