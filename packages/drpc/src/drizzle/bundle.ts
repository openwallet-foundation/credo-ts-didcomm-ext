import type { DrizzleRecordBundle } from '@credo-ts/drizzle-storage'
import { didcommDrpcDrizzleRecord } from './drpc-record'
import { bundleMigrationDefinition } from './util'

/**
 * Drizzle record bundle for the drpc module. Register it in the `bundles` option of the
 * `DrizzleStorageModule`, and pass `@credo-ts/didcomm-drpc/drizzle` to the `--bundle` option of the
 * drizzle-storage CLI to generate or apply the migrations.
 */
export const didcommDrpcBundle = {
  name: 'drpc',
  records: [didcommDrpcDrizzleRecord],

  migrations: bundleMigrationDefinition(import.meta.dirname),
} as const satisfies DrizzleRecordBundle

export { didcommDrpcDrizzleRecord } from './drpc-record'
export { DrizzleDidCommDrpcRecordAdapter } from './drpc-record/DrizzleDidCommDrpcRecordAdapter'
