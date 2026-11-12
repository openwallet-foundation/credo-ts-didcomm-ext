import type { DrizzleRecord } from '@credo-ts/drizzle-storage'
import { DrizzleDidCommDrpcRecordAdapter } from './DrizzleDidCommDrpcRecordAdapter'
import * as postgres from './postgres'
import * as sqlite from './sqlite'

export const didcommDrpcDrizzleRecord = {
  adapter: DrizzleDidCommDrpcRecordAdapter,
  postgres,
  sqlite,
} satisfies DrizzleRecord
