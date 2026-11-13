import type { DrizzleRecordBundle } from '@credo-ts/drizzle-storage'
import { didcommUserProfileDrizzleRecord } from './user-profile-record'
import { bundleMigrationDefinition } from './util'

/**
 * Drizzle record bundle for the user profile module. Register it in the `bundles` option of the
 * `DrizzleStorageModule`, and pass `@credo-ts/didcomm-user-profile/drizzle` to the `--bundle` option of the
 * drizzle-storage CLI to generate or apply the migrations.
 */
export const didcommUserProfileBundle = {
  name: 'user-profile',
  records: [didcommUserProfileDrizzleRecord],

  migrations: bundleMigrationDefinition(import.meta.dirname),
} as const satisfies DrizzleRecordBundle

export { didcommUserProfileDrizzleRecord } from './user-profile-record'
export { DrizzleDidCommUserProfileRecordAdapter } from './user-profile-record/DrizzleDidCommUserProfileRecordAdapter'
