import { getPostgresBaseRecordTable, postgresBaseRecordIndexes } from '@credo-ts/drizzle-storage'
import { didcommConnection } from '@credo-ts/drizzle-storage/didcomm/postgres'
import { foreignKey, jsonb, pgEnum, pgTable, text, timestamp, unique } from 'drizzle-orm/pg-core'
import type { DidCommMediaSharingRole, DidCommMediaSharingState, SharedMediaItem } from '../../index'
import { exhaustiveArray } from '../util'

export const didcommMediaSharingStates = exhaustiveArray(
  {} as DidCommMediaSharingState,
  ['init', 'media-requested', 'media-shared', 'done'] as const
)
export const didcommMediaSharingStateEnum = pgEnum('DidcommMediaSharingState', didcommMediaSharingStates)

export const didcommMediaSharingRoles = exhaustiveArray({} as DidCommMediaSharingRole, ['sender', 'receiver'] as const)
export const didcommMediaSharingRoleEnum = pgEnum('DidcommMediaSharingRole', didcommMediaSharingRoles)

export const didcommMediaSharing = pgTable(
  'DidcommMediaSharing',
  {
    ...getPostgresBaseRecordTable(),

    items: jsonb().$type<SharedMediaItem[]>(),
    description: text(),
    sentTime: timestamp('sent_time', { withTimezone: true, precision: 3 }),

    state: didcommMediaSharingStateEnum().notNull(),
    role: didcommMediaSharingRoleEnum().notNull(),

    connectionId: text('connection_id').notNull(),
    threadId: text('thread_id'),
    parentThreadId: text('parent_thread_id'),
  },
  (table) => [
    ...postgresBaseRecordIndexes(table, 'didcommMediaSharing'),
    unique().on(table.contextCorrelationId, table.threadId),
    foreignKey({
      columns: [table.connectionId, table.contextCorrelationId],
      foreignColumns: [didcommConnection.id, didcommConnection.contextCorrelationId],
    }).onDelete('cascade'),
  ]
)
