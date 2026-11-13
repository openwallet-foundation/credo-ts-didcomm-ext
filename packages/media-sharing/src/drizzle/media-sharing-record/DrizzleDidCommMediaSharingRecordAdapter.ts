import { JsonTransformer, type TagsBase } from '@credo-ts/core'
import {
  BaseDrizzleRecordAdapter,
  type DrizzleAdapterRecordValues,
  type DrizzleDatabase,
} from '@credo-ts/drizzle-storage'
import { DidCommMediaSharingRecord, type SharedMediaItem } from '../../repository/DidCommMediaSharingRecord'
import * as postgres from './postgres'
import * as sqlite from './sqlite'

type DrizzleDidCommMediaSharingRecordAdapterValues = DrizzleAdapterRecordValues<(typeof sqlite)['didcommMediaSharing']>

export class DrizzleDidCommMediaSharingRecordAdapter extends BaseDrizzleRecordAdapter<
  DidCommMediaSharingRecord,
  typeof postgres.didcommMediaSharing,
  typeof postgres,
  typeof sqlite.didcommMediaSharing,
  typeof sqlite
> {
  public constructor(database: DrizzleDatabase<typeof postgres, typeof sqlite>) {
    super(
      database,
      { postgres: postgres.didcommMediaSharing, sqlite: sqlite.didcommMediaSharing },
      DidCommMediaSharingRecord
    )
  }

  public getValues(record: DidCommMediaSharingRecord) {
    const { connectionId, threadId, parentThreadId, role, state, ...customTags } = record.getTags()

    return {
      connectionId,
      threadId: threadId ?? null,
      parentThreadId: parentThreadId ?? null,
      role,
      state,
      description: record.description ?? null,
      sentTime: record.sentTime ?? null,
      // The items are class instances. Store them as plain JSON, like the stored shape of the record
      items: record.items ? (JsonTransformer.toJSON(record.items) as SharedMediaItem[]) : null,
      customTags,
    }
  }

  public toRecord(values: DrizzleDidCommMediaSharingRecordAdapterValues): DidCommMediaSharingRecord {
    const { customTags, ...remainingValues } = values

    const record = JsonTransformer.fromJSON(remainingValues, DidCommMediaSharingRecord)
    if (customTags) record.setTags(customTags as TagsBase)

    return record
  }
}
