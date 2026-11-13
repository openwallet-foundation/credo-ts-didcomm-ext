import { getPostgresBaseRecordTable, postgresBaseRecordIndexes } from '@credo-ts/drizzle-storage'
import { didcommConnection } from '@credo-ts/drizzle-storage/didcomm/postgres'
import { boolean, foreignKey, jsonb, pgEnum, pgTable, text, unique } from 'drizzle-orm/pg-core'
import type {
  DidCommQuestionAnswerRole,
  DidCommQuestionAnswerState,
  DidCommQuestionAnswerValidResponse,
} from '../../index'
import { exhaustiveArray } from '../util'

export const didcommQuestionAnswerStates = exhaustiveArray(
  {} as DidCommQuestionAnswerState,
  ['question-sent', 'answer-received', 'question-received', 'answer-sent'] as const
)
export const didcommQuestionAnswerStateEnum = pgEnum('DidcommQuestionAnswerState', didcommQuestionAnswerStates)

export const didcommQuestionAnswerRoles = exhaustiveArray(
  {} as DidCommQuestionAnswerRole,
  ['questioner', 'responder'] as const
)
export const didcommQuestionAnswerRoleEnum = pgEnum('DidcommQuestionAnswerRole', didcommQuestionAnswerRoles)

export const didcommQuestionAnswer = pgTable(
  'DidcommQuestionAnswer',
  {
    ...getPostgresBaseRecordTable(),

    state: didcommQuestionAnswerStateEnum().notNull(),
    role: didcommQuestionAnswerRoleEnum().notNull(),

    connectionId: text('connection_id').notNull(),
    threadId: text('thread_id').notNull(),

    questionText: text('question_text').notNull(),
    questionDetail: text('question_detail'),
    validResponses: jsonb('valid_responses').notNull().$type<DidCommQuestionAnswerValidResponse[]>(),
    signatureRequired: boolean('signature_required').notNull(),
    response: text(),
  },
  (table) => [
    ...postgresBaseRecordIndexes(table, 'didcommQuestionAnswer'),
    unique().on(table.contextCorrelationId, table.threadId),
    foreignKey({
      columns: [table.connectionId, table.contextCorrelationId],
      foreignColumns: [didcommConnection.id, didcommConnection.contextCorrelationId],
    }).onDelete('cascade'),
  ]
)
