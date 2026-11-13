import { existsSync } from 'node:fs'
import path from 'node:path'
import { Agent, Kms } from '@credo-ts/core'
import { DidCommModule } from '@credo-ts/didcomm'
import { DrizzleStorageModule } from '@credo-ts/drizzle-storage'
import { didcommBundle } from '@credo-ts/drizzle-storage/didcomm'
import { agentDependencies, NodeInMemoryKeyManagementStorage, NodeKeyManagementService } from '@credo-ts/node'
import { pushSQLiteSchema } from 'drizzle-kit/api'
import { drizzle } from 'drizzle-orm/libsql'
import { testLogger } from '../../../tests/logger'
import { DidCommUserProfileModule, DidCommUserProfileRecord, DidCommUserProfileRepository } from '../src'
import { didcommUserProfileBundle } from '../src/drizzle/bundle'

const createRecord = () => {
  const record = new DidCommUserProfileRecord({
    displayName: 'Alice',
    displayPicture: { mimeType: 'image/png', base64: 'iVBORw0KGgo=' },
    description: 'A test profile',
    preferredLanguage: 'en',
  })
  record.setTag('custom', 'tag')
  return record
}

describe('didcommUserProfileBundle', () => {
  let agent: Agent
  let repository: DidCommUserProfileRepository

  beforeAll(async () => {
    const storage = new DrizzleStorageModule({
      database: drizzle(':memory:'),
      bundles: [didcommBundle, didcommUserProfileBundle],
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
        userProfile: new DidCommUserProfileModule(),
      },
    })
    await agent.initialize()

    repository = agent.dependencyManager.resolve(DidCommUserProfileRepository)
  })

  afterAll(async () => {
    await agent.shutdown()
  })

  test('points to the migration files of the package', () => {
    expect(didcommUserProfileBundle.name).toBe('user-profile')
    expect(existsSync(path.join(didcommUserProfileBundle.migrations.sqlite.migrationsPath, 'meta/_journal.json'))).toBe(
      true
    )
    expect(
      existsSync(path.join(didcommUserProfileBundle.migrations.postgres.migrationsPath, 'meta/_journal.json'))
    ).toBe(true)
    expect(existsSync(didcommUserProfileBundle.migrations.sqlite.schemaPath)).toBe(true)
    expect(existsSync(didcommUserProfileBundle.migrations.postgres.schemaPath)).toBe(true)
  })

  test('saves, queries, updates, and deletes a record', async () => {
    const record = createRecord()
    await repository.save(agent.context, record)

    const stored = await repository.getById(agent.context, record.id)
    expect(stored).toBeInstanceOf(DidCommUserProfileRecord)
    expect(stored).toEqual(record)
    expect(stored.getTags()).toEqual(record.getTags())

    expect(await repository.findByQuery(agent.context, { custom: 'tag' })).toEqual([record])
    expect(await repository.findByQuery(agent.context, { custom: 'other' })).toEqual([])

    record.displayName = 'Bob'
    record.displayPicture = ''
    record.description = undefined
    await repository.update(agent.context, record)
    const updated = await repository.getById(agent.context, record.id)
    expect(updated.displayName).toBe('Bob')
    expect(updated.displayPicture).toBe('')
    expect(updated.description).toBeUndefined()

    await repository.delete(agent.context, record)
    expect(await repository.findById(agent.context, record.id)).toBeNull()
  })
})
