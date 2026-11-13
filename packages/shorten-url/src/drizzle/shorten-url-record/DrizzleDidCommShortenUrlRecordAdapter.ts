import { JsonTransformer, type TagsBase } from '@credo-ts/core'
import {
  BaseDrizzleRecordAdapter,
  type DrizzleAdapterRecordValues,
  type DrizzleDatabase,
} from '@credo-ts/drizzle-storage'
import { DidCommShortenUrlRecord } from '../../repository/DidCommShortenUrlRecord'
import * as postgres from './postgres'
import * as sqlite from './sqlite'

type DrizzleDidCommShortenUrlRecordAdapterValues = DrizzleAdapterRecordValues<(typeof sqlite)['didcommShortenUrl']>

export class DrizzleDidCommShortenUrlRecordAdapter extends BaseDrizzleRecordAdapter<
  DidCommShortenUrlRecord,
  typeof postgres.didcommShortenUrl,
  typeof postgres,
  typeof sqlite.didcommShortenUrl,
  typeof sqlite
> {
  public constructor(database: DrizzleDatabase<typeof postgres, typeof sqlite>) {
    super(database, { postgres: postgres.didcommShortenUrl, sqlite: sqlite.didcommShortenUrl }, DidCommShortenUrlRecord)
  }

  public getValues(record: DidCommShortenUrlRecord) {
    const {
      connectionId,
      role,
      state,
      threadId,
      shortenedUrl,
      url,
      goalCode,
      shortUrlSlug,
      invalidationMessageId,
      ...customTags
    } = record.getTags()

    return {
      connectionId,
      threadId,
      role,
      state,
      url,
      shortenedUrl: shortenedUrl ?? null,
      goalCode: goalCode ?? null,
      requestedValiditySeconds: record.requestedValiditySeconds ?? null,
      shortUrlSlug: shortUrlSlug ?? null,
      expiresTime: record.expiresTime ?? null,
      invalidationMessageId: invalidationMessageId ?? null,
      customTags,
    }
  }

  public toRecord(values: DrizzleDidCommShortenUrlRecordAdapterValues): DidCommShortenUrlRecord {
    const { customTags, ...remainingValues } = values

    const record = JsonTransformer.fromJSON(remainingValues, DidCommShortenUrlRecord)
    if (customTags) record.setTags(customTags as TagsBase)

    return record
  }
}
