import { getSqliteBaseRecordTable, sqliteBaseRecordIndexes } from '@credo-ts/drizzle-storage'
import { didcommConnection } from '@credo-ts/drizzle-storage/didcomm/sqlite'
import { foreignKey, integer, sqliteTable, text, unique } from 'drizzle-orm/sqlite-core'
import type {
  DidCommQuestionAnswerRole,
  DidCommQuestionAnswerState,
  DidCommQuestionAnswerValidResponse,
} from '../../index'

export const didcommQuestionAnswer = sqliteTable(
  'DidcommQuestionAnswer',
  {
    ...getSqliteBaseRecordTable(),

    state: text('state').$type<DidCommQuestionAnswerState>().notNull(),
    role: text('role').$type<DidCommQuestionAnswerRole>().notNull(),

    connectionId: text('connection_id').notNull(),
    threadId: text('thread_id').notNull(),

    questionText: text('question_text').notNull(),
    questionDetail: text('question_detail'),
    validResponses: text('valid_responses', { mode: 'json' }).notNull().$type<DidCommQuestionAnswerValidResponse[]>(),
    signatureRequired: integer('signature_required', { mode: 'boolean' }).notNull(),
    response: text(),
  },
  (table) => [
    ...sqliteBaseRecordIndexes(table, 'didcommQuestionAnswer'),
    unique().on(table.contextCorrelationId, table.threadId),
    foreignKey({
      columns: [table.connectionId, table.contextCorrelationId],
      foreignColumns: [didcommConnection.id, didcommConnection.contextCorrelationId],
    }).onDelete('cascade'),
  ]
)
