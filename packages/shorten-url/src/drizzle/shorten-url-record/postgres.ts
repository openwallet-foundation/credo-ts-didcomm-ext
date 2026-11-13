import { getPostgresBaseRecordTable, postgresBaseRecordIndexes } from '@credo-ts/drizzle-storage'
import { didcommConnection } from '@credo-ts/drizzle-storage/didcomm/postgres'
import { foreignKey, integer, pgEnum, pgTable, text, timestamp, unique } from 'drizzle-orm/pg-core'
import type { ShortenUrlRole, ShortenUrlState } from '../../index'
import { exhaustiveArray } from '../util'

export const didcommShortenUrlStates = exhaustiveArray(
  {} as ShortenUrlState,
  [
    'request-sent',
    'request-received',
    'shortened-sent',
    'shortened-received',
    'invalidation-sent',
    'invalidation-received',
    'invalidated',
  ] as const
)
export const didcommShortenUrlStateEnum = pgEnum('DidcommShortenUrlState', didcommShortenUrlStates)

export const didcommShortenUrlRoles = exhaustiveArray(
  {} as ShortenUrlRole,
  ['url-shortener', 'long-url-provider'] as const
)
export const didcommShortenUrlRoleEnum = pgEnum('DidcommShortenUrlRole', didcommShortenUrlRoles)

export const didcommShortenUrl = pgTable(
  'DidcommShortenUrl',
  {
    ...getPostgresBaseRecordTable(),

    url: text().notNull(),
    shortenedUrl: text('shortened_url'),
    goalCode: text('goal_code'),
    requestedValiditySeconds: integer('requested_validity_seconds'),
    shortUrlSlug: text('short_url_slug'),
    expiresTime: timestamp('expires_time', { withTimezone: true, precision: 3 }),
    invalidationMessageId: text('invalidation_message_id'),

    state: didcommShortenUrlStateEnum().notNull(),
    role: didcommShortenUrlRoleEnum().notNull(),

    connectionId: text('connection_id').notNull(),
    threadId: text('thread_id').notNull(),
  },
  (table) => [
    ...postgresBaseRecordIndexes(table, 'didcommShortenUrl'),
    unique().on(table.contextCorrelationId, table.threadId),
    foreignKey({
      columns: [table.connectionId, table.contextCorrelationId],
      foreignColumns: [didcommConnection.id, didcommConnection.contextCorrelationId],
    }).onDelete('cascade'),
  ]
)
