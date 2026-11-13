import type { DrizzleRecord } from '@credo-ts/drizzle-storage'
import { DrizzleDidCommQuestionAnswerRecordAdapter } from './DrizzleDidCommQuestionAnswerRecordAdapter'
import * as postgres from './postgres'
import * as sqlite from './sqlite'

export const didcommQuestionAnswerDrizzleRecord = {
  adapter: DrizzleDidCommQuestionAnswerRecordAdapter,
  postgres,
  sqlite,
} satisfies DrizzleRecord
