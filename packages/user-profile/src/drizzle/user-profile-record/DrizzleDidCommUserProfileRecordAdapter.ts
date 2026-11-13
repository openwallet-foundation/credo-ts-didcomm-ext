import { JsonTransformer, type TagsBase } from '@credo-ts/core'
import {
  BaseDrizzleRecordAdapter,
  type DrizzleAdapterRecordValues,
  type DrizzleDatabase,
} from '@credo-ts/drizzle-storage'
import { DidCommUserProfileRecord } from '../../repository/DidCommUserProfileRecord'
import * as postgres from './postgres'
import * as sqlite from './sqlite'

type DrizzleDidCommUserProfileRecordAdapterValues = DrizzleAdapterRecordValues<(typeof sqlite)['didcommUserProfile']>

export class DrizzleDidCommUserProfileRecordAdapter extends BaseDrizzleRecordAdapter<
  DidCommUserProfileRecord,
  typeof postgres.didcommUserProfile,
  typeof postgres,
  typeof sqlite.didcommUserProfile,
  typeof sqlite
> {
  public constructor(database: DrizzleDatabase<typeof postgres, typeof sqlite>) {
    super(
      database,
      { postgres: postgres.didcommUserProfile, sqlite: sqlite.didcommUserProfile },
      DidCommUserProfileRecord
    )
  }

  public getValues(record: DidCommUserProfileRecord) {
    const customTags = record.getTags()

    return {
      displayName: record.displayName ?? null,
      displayPicture: record.displayPicture ?? null,
      displayIcon: record.displayIcon ?? null,
      description: record.description ?? null,
      preferredLanguage: record.preferredLanguage ?? null,
      customTags,
    }
  }

  public toRecord(values: DrizzleDidCommUserProfileRecordAdapterValues): DidCommUserProfileRecord {
    const { customTags, ...remainingValues } = values

    const record = JsonTransformer.fromJSON(remainingValues, DidCommUserProfileRecord)
    if (customTags) record.setTags(customTags as TagsBase)

    return record
  }
}
