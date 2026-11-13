import type { DrizzleRecordBundle } from '@credo-ts/drizzle-storage'
import { didcommShortenUrlDrizzleRecord } from './shorten-url-record'
import { bundleMigrationDefinition } from './util'

/**
 * Drizzle record bundle for the shorten url module. Register it in the `bundles` option of the
 * `DrizzleStorageModule`, and pass `@credo-ts/didcomm-shorten-url/drizzle` to the `--bundle` option of the
 * drizzle-storage CLI to generate or apply the migrations.
 */
export const didcommShortenUrlBundle = {
  name: 'shorten-url',
  records: [didcommShortenUrlDrizzleRecord],

  migrations: bundleMigrationDefinition(import.meta.dirname),
} as const satisfies DrizzleRecordBundle

export { didcommShortenUrlDrizzleRecord } from './shorten-url-record'
export { DrizzleDidCommShortenUrlRecordAdapter } from './shorten-url-record/DrizzleDidCommShortenUrlRecordAdapter'
