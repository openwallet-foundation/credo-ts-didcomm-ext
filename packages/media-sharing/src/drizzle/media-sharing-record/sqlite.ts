import { getSqliteBaseRecordTable, sqliteBaseRecordIndexes } from '@credo-ts/drizzle-storage'
import { didcommConnection } from '@credo-ts/drizzle-storage/didcomm/sqlite'
import { foreignKey, integer, sqliteTable, text, unique } from 'drizzle-orm/sqlite-core'
import type { DidCommMediaSharingRole, DidCommMediaSharingState, SharedMediaItem } from '../../index'

export const didcommMediaSharing = sqliteTable(
  'DidcommMediaSharing',
  {
    ...getSqliteBaseRecordTable(),

    items: text({ mode: 'json' }).$type<SharedMediaItem[]>(),
    description: text(),
    sentTime: integer('sent_time', { mode: 'timestamp_ms' }),

    state: text('state').$type<DidCommMediaSharingState>().notNull(),
    role: text('role').$type<DidCommMediaSharingRole>().notNull(),

    connectionId: text('connection_id').notNull(),
    threadId: text('thread_id'),
    parentThreadId: text('parent_thread_id'),
  },
  (table) => [
    ...sqliteBaseRecordIndexes(table, 'didcommMediaSharing'),
    unique().on(table.contextCorrelationId, table.threadId),
    foreignKey({
      columns: [table.connectionId, table.contextCorrelationId],
      foreignColumns: [didcommConnection.id, didcommConnection.contextCorrelationId],
    }).onDelete('cascade'),
  ]
)
