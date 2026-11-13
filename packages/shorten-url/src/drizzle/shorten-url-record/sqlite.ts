import { getSqliteBaseRecordTable, sqliteBaseRecordIndexes } from '@credo-ts/drizzle-storage'
import { didcommConnection } from '@credo-ts/drizzle-storage/didcomm/sqlite'
import { foreignKey, integer, sqliteTable, text, unique } from 'drizzle-orm/sqlite-core'
import type { ShortenUrlRole, ShortenUrlState } from '../../index'

export const didcommShortenUrl = sqliteTable(
  'DidcommShortenUrl',
  {
    ...getSqliteBaseRecordTable(),

    url: text().notNull(),
    shortenedUrl: text('shortened_url'),
    goalCode: text('goal_code'),
    requestedValiditySeconds: integer('requested_validity_seconds'),
    shortUrlSlug: text('short_url_slug'),
    expiresTime: integer('expires_time', { mode: 'timestamp_ms' }),
    invalidationMessageId: text('invalidation_message_id'),

    state: text('state').$type<ShortenUrlState>().notNull(),
    role: text('role').$type<ShortenUrlRole>().notNull(),

    connectionId: text('connection_id').notNull(),
    threadId: text('thread_id').notNull(),
  },
  (table) => [
    ...sqliteBaseRecordIndexes(table, 'didcommShortenUrl'),
    unique().on(table.contextCorrelationId, table.threadId),
    foreignKey({
      columns: [table.connectionId, table.contextCorrelationId],
      foreignColumns: [didcommConnection.id, didcommConnection.contextCorrelationId],
    }).onDelete('cascade'),
  ]
)
