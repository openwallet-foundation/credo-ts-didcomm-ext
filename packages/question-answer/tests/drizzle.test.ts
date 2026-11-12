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
  DidCommQuestionAnswerModule,
  DidCommQuestionAnswerRecord,
  DidCommQuestionAnswerRepository,
  DidCommQuestionAnswerRole,
  DidCommQuestionAnswerState,
} from '../src'
import { didcommQuestionAnswerBundle } from '../src/drizzle/bundle'

const createRecord = () =>
  new DidCommQuestionAnswerRecord({
    connectionId: 'connection-id',
    threadId: 'thread-id',
    role: DidCommQuestionAnswerRole.Questioner,
    state: DidCommQuestionAnswerState.QuestionSent,
    questionText: 'Are you on the phone?',
    questionDetail: 'We noticed a login from a new device',
    validResponses: [{ text: 'Yes' }, { text: 'No' }],
    signatureRequired: false,
    tags: { custom: 'tag' },
  })

describe('didcommQuestionAnswerBundle', () => {
  let agent: Agent
  let repository: DidCommQuestionAnswerRepository

  beforeAll(async () => {
    const storage = new DrizzleStorageModule({
      database: drizzle(':memory:'),
      bundles: [didcommBundle, didcommQuestionAnswerBundle],
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
        questionAnswer: new DidCommQuestionAnswerModule(),
      },
    })
    await agent.initialize()

    repository = agent.dependencyManager.resolve(DidCommQuestionAnswerRepository)

    // The record table has a foreign key to the connection table
    const connection = getMockConnection({ id: 'connection-id' })
    await agent.dependencyManager.resolve(DidCommConnectionRepository).save(agent.context, connection)
  })

  afterAll(async () => {
    await agent.shutdown()
  })

  test('points to the migration files of the package', () => {
    expect(didcommQuestionAnswerBundle.name).toBe('question-answer')
    expect(
      existsSync(path.join(didcommQuestionAnswerBundle.migrations.sqlite.migrationsPath, 'meta/_journal.json'))
    ).toBe(true)
    expect(
      existsSync(path.join(didcommQuestionAnswerBundle.migrations.postgres.migrationsPath, 'meta/_journal.json'))
    ).toBe(true)
    expect(existsSync(didcommQuestionAnswerBundle.migrations.sqlite.schemaPath)).toBe(true)
    expect(existsSync(didcommQuestionAnswerBundle.migrations.postgres.schemaPath)).toBe(true)
  })

  test('saves, queries, updates, and deletes a record', async () => {
    const record = createRecord()
    await repository.save(agent.context, record)

    const stored = await repository.getById(agent.context, record.id)
    expect(stored).toBeInstanceOf(DidCommQuestionAnswerRecord)
    expect(stored).toEqual(record)
    expect(stored.getTags()).toEqual(record.getTags())

    expect(await repository.findByQuery(agent.context, { threadId: 'thread-id' })).toEqual([record])
    expect(await repository.findByQuery(agent.context, { custom: 'tag' })).toEqual([record])
    expect(await repository.findByQuery(agent.context, { custom: 'other' })).toEqual([])

    record.state = DidCommQuestionAnswerState.AnswerReceived
    await repository.update(agent.context, record)
    expect((await repository.getById(agent.context, record.id)).state).toBe(DidCommQuestionAnswerState.AnswerReceived)

    await repository.delete(agent.context, record)
    expect(await repository.findById(agent.context, record.id)).toBeNull()
  })
})
