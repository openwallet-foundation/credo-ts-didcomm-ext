import { getSqliteBaseRecordTable, sqliteBaseRecordIndexes } from '@credo-ts/drizzle-storage'
import { didcommConnection } from '@credo-ts/drizzle-storage/didcomm/sqlite'
import { foreignKey, sqliteTable, text, unique } from 'drizzle-orm/sqlite-core'
import type {
  DidCommActionMenuOptions,
  DidCommActionMenuRole,
  DidCommActionMenuSelectionOptions,
  DidCommActionMenuState,
} from '../../index'

export const didcommActionMenu = sqliteTable(
  'DidcommActionMenu',
  {
    ...getSqliteBaseRecordTable(),

    state: text('state').$type<DidCommActionMenuState>().notNull(),
    role: text('role').$type<DidCommActionMenuRole>().notNull(),

    connectionId: text('connection_id').notNull(),
    threadId: text('thread_id').notNull(),

    menu: text('menu', { mode: 'json' }).$type<DidCommActionMenuOptions>(),
    performedAction: text('performed_action', { mode: 'json' }).$type<DidCommActionMenuSelectionOptions>(),
  },
  (table) => [
    ...sqliteBaseRecordIndexes(table, 'didcommActionMenu'),
    unique().on(table.contextCorrelationId, table.threadId),
    foreignKey({
      columns: [table.connectionId, table.contextCorrelationId],
      foreignColumns: [didcommConnection.id, didcommConnection.contextCorrelationId],
    }).onDelete('cascade'),
  ]
)
