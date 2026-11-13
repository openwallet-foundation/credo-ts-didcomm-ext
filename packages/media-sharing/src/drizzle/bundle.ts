import type { DrizzleRecordBundle } from '@credo-ts/drizzle-storage'
import { didcommMediaSharingDrizzleRecord } from './media-sharing-record'
import { bundleMigrationDefinition } from './util'

/**
 * Drizzle record bundle for the media sharing module. Register it in the `bundles` option of the
 * `DrizzleStorageModule`, and pass `@credo-ts/didcomm-media-sharing/drizzle` to the `--bundle` option of the
 * drizzle-storage CLI to generate or apply the migrations.
 */
export const didcommMediaSharingBundle = {
  name: 'media-sharing',
  records: [didcommMediaSharingDrizzleRecord],

  migrations: bundleMigrationDefinition(import.meta.dirname),
} as const satisfies DrizzleRecordBundle

export { didcommMediaSharingDrizzleRecord } from './media-sharing-record'
export { DrizzleDidCommMediaSharingRecordAdapter } from './media-sharing-record/DrizzleDidCommMediaSharingRecordAdapter'
