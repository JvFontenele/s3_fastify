import { describe, expect, it, vi } from 'vitest'
import Fastify from 'fastify'
import folderRoutes from '../folder.routes.js'
import { errorPlugin } from '@/plugins/error-handler.js'
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod'

vi.mock('@/hooks/auth', () => ({
  authHook: async (request: any) => {
    request.user = {
      person: { id: 1 },
    }
  },
}))

type FolderEntity = {
  id: number
  name: string
  path: string
  personId: number
  parentId: number | null
  allowedTypes: string[]
}

function createPrismaMock() {
  let folderId = 1
  const folders: FolderEntity[] = []
  const filesByFolderId = new Map<number, number>()

  const prisma = {
    person: {
      findUnique: vi.fn(async ({ where }: any) => {
        if (where.id === 1) return { id: 1 }
        return null
      }),
    },
    folder: {
      findFirst: vi.fn(async ({ where }: any) => {
        return (
          folders.find((folder) => {
            if (where.id !== undefined && folder.id !== where.id) return false
            if (where.personId !== undefined && folder.personId !== where.personId) return false
            if (where.parentId !== undefined && folder.parentId !== where.parentId) return false
            if (where.name !== undefined && folder.name !== where.name) return false
            return true
          }) ?? null
        )
      }),
      create: vi.fn(async ({ data }: any) => {
        const entity: FolderEntity = {
          id: folderId++,
          name: data.name,
          path: data.path,
          personId: data.personId,
          parentId: data.parentId ?? null,
          allowedTypes: data.allowedTypes ?? [],
        }
        folders.push(entity)
        return entity
      }),
      findMany: vi.fn(async ({ where, skip = 0, take = 10, orderBy }: any) => {
        let result = folders.filter((folder) => {
          if (where.personId !== undefined && folder.personId !== where.personId) return false
          if (where.parentId !== undefined && folder.parentId !== where.parentId) return false
          if (where.path?.startsWith && !folder.path.startsWith(where.path.startsWith)) return false
          return true
        })

        if (orderBy?.name === 'asc') {
          result = result.sort((a, b) => a.name.localeCompare(b.name))
        }

        return result.slice(skip, skip + take)
      }),
      count: vi.fn(async ({ where }: any) => {
        return folders.filter((folder) => {
          if (where.personId !== undefined && folder.personId !== where.personId) return false
          if (where.parentId !== undefined && folder.parentId !== where.parentId) return false
          return true
        }).length
      }),
      update: vi.fn(async ({ where, data }: any) => {
        const folder = folders.find((item) => item.id === where.id)
        if (!folder) throw new Error('Folder not found')
        Object.assign(folder, data)
        return folder
      }),
      delete: vi.fn(async ({ where }: any) => {
        const index = folders.findIndex((item) => item.id === where.id)
        if (index >= 0) folders.splice(index, 1)
        return null
      }),
    },
    file: {
      count: vi.fn(async ({ where }: any) => {
        return filesByFolderId.get(where.folderId) ?? 0
      }),
    },
  }

  return { prisma, folders, filesByFolderId }
}

describe('folders routes integration', () => {
  const buildApp = async () => {
    const app = Fastify()
    app.setValidatorCompiler(validatorCompiler)
    app.setSerializerCompiler(serializerCompiler)
    const mock = createPrismaMock()
    app.decorate('prisma', mock.prisma)
    await app.register(errorPlugin)
    await app.register(folderRoutes, { prefix: '/folders' })
    await app.ready()
    return { app, mock }
  }

  it('creates folder with allowed types (normalized by service)', async () => {
    const { app } = await buildApp()

    const response = await app.inject({
      method: 'POST',
      url: '/folders',
      payload: {
        name: 'Documentos',
        allowedTypes: ['.PDF', 'image/PNG'],
      },
    })

    expect(response.statusCode).toBe(201)
    const body = response.json()
    expect(body.name).toBe('Documentos')
    expect(body.allowedTypes).toEqual(['pdf', 'image/png'])

    await app.close()
  })

  it('updates folder name and allowedTypes', async () => {
    const { app } = await buildApp()

    const created = await app.inject({
      method: 'POST',
      url: '/folders',
      payload: { name: 'Antigo', allowedTypes: ['pdf'] },
    })
    const folderId = created.json().id

    const response = await app.inject({
      method: 'PATCH',
      url: `/folders/${folderId}`,
      payload: { name: 'Novo', allowedTypes: ['jpg'] },
    })

    expect(response.statusCode).toBe(200)
    const body = response.json()
    expect(body.name).toBe('Novo')
    expect(body.path).toBe('Novo')
    expect(body.allowedTypes).toEqual(['jpg'])

    await app.close()
  })

  it('prevents deleting non-empty folder', async () => {
    const { app, mock } = await buildApp()

    const created = await app.inject({
      method: 'POST',
      url: '/folders',
      payload: { name: 'ComArquivos' },
    })
    const folderId = created.json().id as number
    mock.filesByFolderId.set(folderId, 1)

    const response = await app.inject({
      method: 'DELETE',
      url: `/folders/${folderId}`,
    })

    expect(response.statusCode).toBe(409)
    expect(response.json().message).toBe('A pasta não está vazia.')

    await app.close()
  })

  it('gets folder by id', async () => {
    const { app } = await buildApp()

    const created = await app.inject({
      method: 'POST',
      url: '/folders',
      payload: { name: 'Projetos' },
    })

    const folderId = created.json().id
    const response = await app.inject({
      method: 'GET',
      url: `/folders/${folderId}`,
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toMatchObject({
      id: folderId,
      name: 'Projetos',
      path: 'Projetos',
    })

    await app.close()
  })
})
