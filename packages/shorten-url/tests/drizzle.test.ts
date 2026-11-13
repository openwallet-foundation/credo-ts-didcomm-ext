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
  DidCommShortenUrlModule,
  DidCommShortenUrlRecord,
  DidCommShortenUrlRepository,
  ShortenUrlRole,
  ShortenUrlState,
} from '../src'
import { didcommShortenUrlBundle } from '../src/drizzle/bundle'

const createRecord = () => {
  const record = new DidCommShortenUrlRecord({
    connectionId: 'connection-id',
    threadId: 'thread-id',
    role: ShortenUrlRole.UrlShortener,
    state: ShortenUrlState.RequestReceived,
    url: 'https://example.com/a/very/long/url',
    goalCode: 'shorten.oobv2',
    requestedValiditySeconds: 3600,
    expiresTime: new Date('2026-01-01T11:00:00.000Z'),
  })
  record.setTag('custom', 'tag')
  return record
}

describe('didcommShortenUrlBundle', () => {
  let agent: Agent
  let repository: DidCommShortenUrlRepository

  beforeAll(async () => {
    const storage = new DrizzleStorageModule({
      database: drizzle(':memory:'),
      bundles: [didcommBundle, didcommShortenUrlBundle],
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
        shortenUrl: new DidCommShortenUrlModule(),
      },
    })
    await agent.initialize()

    repository = agent.dependencyManager.resolve(DidCommShortenUrlRepository)

    // The record table has a foreign key to the connection table
    const connection = getMockConnection({ id: 'connection-id' })
    await agent.dependencyManager.resolve(DidCommConnectionRepository).save(agent.context, connection)
  })

  afterAll(async () => {
    await agent.shutdown()
  })

  test('points to the migration files of the package', () => {
    expect(didcommShortenUrlBundle.name).toBe('shorten-url')
    expect(existsSync(path.join(didcommShortenUrlBundle.migrations.sqlite.migrationsPath, 'meta/_journal.json'))).toBe(
      true
    )
    expect(
      existsSync(path.join(didcommShortenUrlBundle.migrations.postgres.migrationsPath, 'meta/_journal.json'))
    ).toBe(true)
    expect(existsSync(didcommShortenUrlBundle.migrations.sqlite.schemaPath)).toBe(true)
    expect(existsSync(didcommShortenUrlBundle.migrations.postgres.schemaPath)).toBe(true)
  })

  test('saves, queries, updates, and deletes a record', async () => {
    const record = createRecord()
    await repository.save(agent.context, record)

    const stored = await repository.getById(agent.context, record.id)
    expect(stored).toBeInstanceOf(DidCommShortenUrlRecord)
    expect(stored).toEqual(record)
    expect(stored.getTags()).toEqual(record.getTags())

    expect(
      await repository.findByQuery(agent.context, {
        connectionId: 'connection-id',
        role: ShortenUrlRole.UrlShortener,
        url: 'https://example.com/a/very/long/url',
      })
    ).toEqual([record])
    expect(await repository.findByQuery(agent.context, { custom: 'tag' })).toEqual([record])
    expect(await repository.findByQuery(agent.context, { custom: 'other' })).toEqual([])

    record.state = ShortenUrlState.ShortenedSent
    record.shortenedUrl = 'https://example.io/a1b2'
    record.shortUrlSlug = 'a1b2'
    await repository.update(agent.context, record)
    const updated = await repository.getById(agent.context, record.id)
    expect(updated.state).toBe(ShortenUrlState.ShortenedSent)
    expect(await repository.findByQuery(agent.context, { shortenedUrl: 'https://example.io/a1b2' })).toEqual([record])

    await repository.delete(agent.context, record)
    expect(await repository.findById(agent.context, record.id)).toBeNull()
  })
})
