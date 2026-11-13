import type { DrizzleRecord } from '@credo-ts/drizzle-storage'
import { DrizzleDidCommShortenUrlRecordAdapter } from './DrizzleDidCommShortenUrlRecordAdapter'
import * as postgres from './postgres'
import * as sqlite from './sqlite'

export const didcommShortenUrlDrizzleRecord = {
  adapter: DrizzleDidCommShortenUrlRecordAdapter,
  postgres,
  sqlite,
} satisfies DrizzleRecord
