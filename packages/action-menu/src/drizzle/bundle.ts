import type { DrizzleRecordBundle } from '@credo-ts/drizzle-storage'
import { didcommActionMenuDrizzleRecord } from './action-menu-record'
import { bundleMigrationDefinition } from './util'

/**
 * Drizzle record bundle for the action-menu module. Register it in the `bundles` option of the
 * `DrizzleStorageModule`, and pass `@credo-ts/didcomm-action-menu/drizzle` to the `--bundle` option of the
 * drizzle-storage CLI to generate or apply the migrations.
 */
export const didcommActionMenuBundle = {
  name: 'action-menu',
  records: [didcommActionMenuDrizzleRecord],

  migrations: bundleMigrationDefinition(import.meta.dirname),
} as const satisfies DrizzleRecordBundle

export { didcommActionMenuDrizzleRecord } from './action-menu-record'
export { DrizzleDidCommActionMenuRecordAdapter } from './action-menu-record/DrizzleDidCommActionMenuRecordAdapter'
