import { JsonTransformer, type TagsBase } from '@credo-ts/core'
import {
  BaseDrizzleRecordAdapter,
  type DrizzleAdapterRecordValues,
  type DrizzleDatabase,
} from '@credo-ts/drizzle-storage'
import { DidCommQuestionAnswerRecord } from '../../repository/DidCommQuestionAnswerRecord'
import * as postgres from './postgres'
import * as sqlite from './sqlite'

type DrizzleDidCommQuestionAnswerRecordAdapterValues = DrizzleAdapterRecordValues<
  (typeof sqlite)['didcommQuestionAnswer']
>

export class DrizzleDidCommQuestionAnswerRecordAdapter extends BaseDrizzleRecordAdapter<
  DidCommQuestionAnswerRecord,
  typeof postgres.didcommQuestionAnswer,
  typeof postgres,
  typeof sqlite.didcommQuestionAnswer,
  typeof sqlite
> {
  public constructor(database: DrizzleDatabase<typeof postgres, typeof sqlite>) {
    super(
      database,
      { postgres: postgres.didcommQuestionAnswer, sqlite: sqlite.didcommQuestionAnswer },
      DidCommQuestionAnswerRecord
    )
  }

  public getValues(record: DidCommQuestionAnswerRecord) {
    const { connectionId, role, state, threadId, ...customTags } = record.getTags()

    return {
      state,
      role,
      connectionId,
      threadId,

      questionText: record.questionText,
      questionDetail: record.questionDetail,
      validResponses: record.validResponses,
      signatureRequired: record.signatureRequired,
      response: record.response,

      customTags,
    }
  }

  public toRecord(values: DrizzleDidCommQuestionAnswerRecordAdapterValues): DidCommQuestionAnswerRecord {
    const { customTags, ...remainingValues } = values

    const record = JsonTransformer.fromJSON(remainingValues, DidCommQuestionAnswerRecord)
    if (customTags) record.setTags(customTags as TagsBase)

    return record
  }
}
