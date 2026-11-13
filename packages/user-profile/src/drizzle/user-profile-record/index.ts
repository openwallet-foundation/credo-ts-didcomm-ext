import type { DrizzleRecord } from '@credo-ts/drizzle-storage'
import { DrizzleDidCommUserProfileRecordAdapter } from './DrizzleDidCommUserProfileRecordAdapter'
import * as postgres from './postgres'
import * as sqlite from './sqlite'

export const didcommUserProfileDrizzleRecord = {
  adapter: DrizzleDidCommUserProfileRecordAdapter,
  postgres,
  sqlite,
} satisfies DrizzleRecord
