import { getSqliteBaseRecordTable, sqliteBaseRecordIndexes } from '@credo-ts/drizzle-storage'
import { didcommConnection } from '@credo-ts/drizzle-storage/didcomm/sqlite'
import { foreignKey, sqliteTable, text, unique } from 'drizzle-orm/sqlite-core'
import type { DidCommDrpcRequest, DidCommDrpcResponse, DidCommDrpcRole, DidCommDrpcState } from '../../index'

export const didcommDrpc = sqliteTable(
  'DidcommDrpc',
  {
    ...getSqliteBaseRecordTable(),

    request: text({ mode: 'json' }).$type<DidCommDrpcRequest>(),
    response: text({ mode: 'json' }).$type<DidCommDrpcResponse>(),

    state: text('state').$type<DidCommDrpcState>().notNull(),
    role: text('role').$type<DidCommDrpcRole>().notNull(),

    connectionId: text('connection_id').notNull(),
    threadId: text('thread_id').notNull(),
  },
  (table) => [
    ...sqliteBaseRecordIndexes(table, 'didcommDrpc'),
    unique().on(table.contextCorrelationId, table.threadId),
    foreignKey({
      columns: [table.connectionId, table.contextCorrelationId],
      foreignColumns: [didcommConnection.id, didcommConnection.contextCorrelationId],
    }).onDelete('cascade'),
  ]
)
