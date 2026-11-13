import { getPostgresBaseRecordTable, postgresBaseRecordIndexes } from '@credo-ts/drizzle-storage'
import { didcommConnection } from '@credo-ts/drizzle-storage/didcomm/postgres'
import { foreignKey, jsonb, pgEnum, pgTable, text, unique } from 'drizzle-orm/pg-core'
import type { DidCommDrpcRequest, DidCommDrpcResponse, DidCommDrpcRole, DidCommDrpcState } from '../../index'
import { exhaustiveArray } from '../util'

export const didcommDrpcStates = exhaustiveArray(
  {} as DidCommDrpcState,
  ['request-sent', 'request-received', 'completed'] as const
)
export const didcommDrpcStateEnum = pgEnum('DidcommDrpcState', didcommDrpcStates)

export const didcommDrpcRoles = exhaustiveArray({} as DidCommDrpcRole, ['client', 'server'] as const)
export const didcommDrpcRoleEnum = pgEnum('DidcommDrpcRole', didcommDrpcRoles)

export const didcommDrpc = pgTable(
  'DidcommDrpc',
  {
    ...getPostgresBaseRecordTable(),

    request: jsonb().$type<DidCommDrpcRequest>(),
    response: jsonb().$type<DidCommDrpcResponse>(),

    state: didcommDrpcStateEnum().notNull(),
    role: didcommDrpcRoleEnum().notNull(),

    connectionId: text('connection_id').notNull(),
    threadId: text('thread_id').notNull(),
  },
  (table) => [
    ...postgresBaseRecordIndexes(table, 'didcommDrpc'),
    unique().on(table.contextCorrelationId, table.threadId),
    foreignKey({
      columns: [table.connectionId, table.contextCorrelationId],
      foreignColumns: [didcommConnection.id, didcommConnection.contextCorrelationId],
    }).onDelete('cascade'),
  ]
)
