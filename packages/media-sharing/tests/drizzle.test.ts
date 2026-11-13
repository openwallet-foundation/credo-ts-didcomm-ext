import { existsSync } from 'node:fs'
import path from 'node:path'
import { Agent, Kms } from '@credo-ts/core'
import { DidCommConnectionRepository, DidCommModule } from '@credo-ts/didcomm'
import { DrizzleStorageModule } from '@credo-ts/drizzle-storage'
import { didcommBundle } from '@credo-ts/drizzle-storage/didcomm'
import { agentDependencies, NodeInMemoryKeyManagementStorage, NodeKeyManagementService } from '@credo-ts/node'
import { pushSQLiteSchema } from 'drizzle-kit/api'
import { drizzle } from 'drizzle-orm/libsql'
import { getMockConnection } from '../../../tests/helpers'
import { testLogger } from '../../../tests/logger'
import {
  DidCommMediaSharingModule,
  DidCommMediaSharingRecord,
  DidCommMediaSharingRepository,
  DidCommMediaSharingRole,
  DidCommMediaSharingState,
  SharedMediaItem,
} from '../src'
import { didcommMediaSharingBundle } from '../src/drizzle/bundle'

const createRecord = () => {
  const record = new DidCommMediaSharingRecord({
    connectionId: 'connection-id',
    threadId: 'thread-id',
    role: DidCommMediaSharingRole.Sender,
    state: DidCommMediaSharingState.Init,
    description: 'A picture',
    sentTime: new Date('2026-01-01T10:00:00.000Z'),
    items: [new SharedMediaItem({ uri: 'https://example.com/picture.png', mimeType: 'image/png', byteCount: 1024 })],
    metadata: { source: 'test' },
  })
  record.setTag('custom', 'tag')
  return record
}

describe('didcommMediaSharingBundle', () => {
  let agent: Agent
  let repository: DidCommMediaSharingRepository

  beforeAll(async () => {
    const storage = new DrizzleStorageModule({
      database: drizzle(':memory:'),
      bundles: [didcommBundle, didcommMediaSharingBundle],
    })

    // Push the schema instead of running the migrations, like the drizzle-storage tests do
    // biome-ignore lint/suspicious/noExplicitAny: the push api expects the concrete database type
    const { apply } = await pushSQLiteSchema(storage.config.schemas, storage.config.database as any)
    await apply()

    agent = new Agent({
      config: { logger: testLogger },
      dependencies: agentDependencies,
      modules: {
        storage,
        // The DIDComm module creates a routing key when the agent initializes
        kms: new Kms.KeyManagementModule({
          backends: [new NodeKeyManagementService(new NodeInMemoryKeyManagementStorage())],
        }),
        didcomm: new DidCommModule(),
        mediaSharing: new DidCommMediaSharingModule(),
      },
    })
    await agent.initialize()

    repository = agent.dependencyManager.resolve(DidCommMediaSharingRepository)

    // The record table has a foreign key to the connection table
    const connection = getMockConnection({ id: 'connection-id' })
    await agent.dependencyManager.resolve(DidCommConnectionRepository).save(agent.context, connection)
  })

  afterAll(async () => {
    await agent.shutdown()
  })

  test('points to the migration files of the package', () => {
    expect(didcommMediaSharingBundle.name).toBe('media-sharing')
    expect(
      existsSync(path.join(didcommMediaSharingBundle.migrations.sqlite.migrationsPath, 'meta/_journal.json'))
    ).toBe(true)
    expect(
      existsSync(path.join(didcommMediaSharingBundle.migrations.postgres.migrationsPath, 'meta/_journal.json'))
    ).toBe(true)
    expect(existsSync(didcommMediaSharingBundle.migrations.sqlite.schemaPath)).toBe(true)
    expect(existsSync(didcommMediaSharingBundle.migrations.postgres.schemaPath)).toBe(true)
  })

  test('saves, queries, updates, and deletes a record', async () => {
    const record = createRecord()
    await repository.save(agent.context, record)

    const stored = await repository.getById(agent.context, record.id)
    expect(stored).toBeInstanceOf(DidCommMediaSharingRecord)
    expect(stored).toEqual(record)
    expect(stored.getTags()).toEqual(record.getTags())

    expect(await repository.findByQuery(agent.context, { threadId: 'thread-id' })).toEqual([record])
    expect(await repository.findByQuery(agent.context, { connectionId: 'connection-id' })).toEqual([record])
    expect(await repository.findByQuery(agent.context, { custom: 'tag' })).toEqual([record])
    expect(await repository.findByQuery(agent.context, { custom: 'other' })).toEqual([])

    record.state = DidCommMediaSharingState.MediaShared
    record.description = undefined
    await repository.update(agent.context, record)
    const updated = await repository.getById(agent.context, record.id)
    expect(updated.state).toBe(DidCommMediaSharingState.MediaShared)
    expect(updated.description).toBeUndefined()
    expect(updated.items?.[0]).toBeInstanceOf(SharedMediaItem)

    await repository.delete(agent.context, record)
    expect(await repository.findById(agent.context, record.id)).toBeNull()
  })
})
