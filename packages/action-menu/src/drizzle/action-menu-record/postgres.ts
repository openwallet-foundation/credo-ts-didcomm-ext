import { getPostgresBaseRecordTable, postgresBaseRecordIndexes } from '@credo-ts/drizzle-storage'
import { didcommConnection } from '@credo-ts/drizzle-storage/didcomm/postgres'
import { foreignKey, jsonb, pgEnum, pgTable, text, unique } from 'drizzle-orm/pg-core'
import type {
  DidCommActionMenuOptions,
  DidCommActionMenuRole,
  DidCommActionMenuSelectionOptions,
  DidCommActionMenuState,
} from '../../index'
import { exhaustiveArray } from '../util'

export const didcommActionMenuStates = exhaustiveArray(
  {} as DidCommActionMenuState,
  ['null', 'awaiting-root-menu', 'preparing-root-menu', 'preparing-selection', 'awaiting-selection', 'done'] as const
)
export const didcommActionMenuStateEnum = pgEnum('DidcommActionMenuState', didcommActionMenuStates)

export const didcommActionMenuRoles = exhaustiveArray({} as DidCommActionMenuRole, ['requester', 'responder'] as const)
export const didcommActionMenuRoleEnum = pgEnum('DidcommActionMenuRole', didcommActionMenuRoles)

export const didcommActionMenu = pgTable(
  'DidcommActionMenu',
  {
    ...getPostgresBaseRecordTable(),

    state: didcommActionMenuStateEnum().notNull(),
    role: didcommActionMenuRoleEnum().notNull(),

    connectionId: text('connection_id').notNull(),
    threadId: text('thread_id').notNull(),

    menu: jsonb('menu').$type<DidCommActionMenuOptions>(),
    performedAction: jsonb('performed_action').$type<DidCommActionMenuSelectionOptions>(),
  },
  (table) => [
    ...postgresBaseRecordIndexes(table, 'didcommActionMenu'),
    unique().on(table.contextCorrelationId, table.threadId),
    foreignKey({
      columns: [table.connectionId, table.contextCorrelationId],
      foreignColumns: [didcommConnection.id, didcommConnection.contextCorrelationId],
    }).onDelete('cascade'),
  ]
)
