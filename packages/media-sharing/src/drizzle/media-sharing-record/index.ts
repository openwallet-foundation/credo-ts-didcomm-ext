import type { DrizzleRecord } from '@credo-ts/drizzle-storage'
import { DrizzleDidCommMediaSharingRecordAdapter } from './DrizzleDidCommMediaSharingRecordAdapter'
import * as postgres from './postgres'
import * as sqlite from './sqlite'

export const didcommMediaSharingDrizzleRecord = {
  adapter: DrizzleDidCommMediaSharingRecordAdapter,
  postgres,
  sqlite,
} satisfies DrizzleRecord
