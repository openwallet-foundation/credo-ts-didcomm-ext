import type { DrizzleRecordBundle } from '@credo-ts/drizzle-storage'
import { didcommQuestionAnswerDrizzleRecord } from './question-answer-record'
import { bundleMigrationDefinition } from './util'

/**
 * Drizzle record bundle for the question-answer module. Register it in the `bundles` option of the
 * `DrizzleStorageModule`, and pass `@credo-ts/didcomm-question-answer/drizzle` to the `--bundle` option of the
 * drizzle-storage CLI to generate or apply the migrations.
 */
export const didcommQuestionAnswerBundle = {
  name: 'question-answer',
  records: [didcommQuestionAnswerDrizzleRecord],

  migrations: bundleMigrationDefinition(import.meta.dirname),
} as const satisfies DrizzleRecordBundle

export { didcommQuestionAnswerDrizzleRecord } from './question-answer-record'
export { DrizzleDidCommQuestionAnswerRecordAdapter } from './question-answer-record/DrizzleDidCommQuestionAnswerRecordAdapter'
