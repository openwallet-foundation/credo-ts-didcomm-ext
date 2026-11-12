import type { DrizzleRecord } from '@credo-ts/drizzle-storage'
import { DrizzleDidCommActionMenuRecordAdapter } from './DrizzleDidCommActionMenuRecordAdapter'
import * as postgres from './postgres'
import * as sqlite from './sqlite'

export const didcommActionMenuDrizzleRecord = {
  adapter: DrizzleDidCommActionMenuRecordAdapter,
  postgres,
  sqlite,
} satisfies DrizzleRecord
