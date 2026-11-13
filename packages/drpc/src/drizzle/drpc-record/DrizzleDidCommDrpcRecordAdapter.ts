import { JsonTransformer, type TagsBase } from '@credo-ts/core'
import {
  BaseDrizzleRecordAdapter,
  type DrizzleAdapterRecordValues,
  type DrizzleDatabase,
} from '@credo-ts/drizzle-storage'
import { DidCommDrpcRecord } from '../../repository/DidCommDrpcRecord'
import * as postgres from './postgres'
import * as sqlite from './sqlite'

type DrizzleDidCommDrpcRecordAdapterValues = DrizzleAdapterRecordValues<(typeof sqlite)['didcommDrpc']>

export class DrizzleDidCommDrpcRecordAdapter extends BaseDrizzleRecordAdapter<
  DidCommDrpcRecord,
  typeof postgres.didcommDrpc,
  typeof postgres,
  typeof sqlite.didcommDrpc,
  typeof sqlite
> {
  public constructor(database: DrizzleDatabase<typeof postgres, typeof sqlite>) {
    super(database, { postgres: postgres.didcommDrpc, sqlite: sqlite.didcommDrpc }, DidCommDrpcRecord)
  }

  public getValues(record: DidCommDrpcRecord) {
    const { connectionId, threadId, ...customTags } = record.getTags()

    return {
      threadId,
      connectionId,
      state: record.state,
      role: record.role,
      request: record.request,
      response: record.response,
      customTags,
    }
  }

  public toRecord(values: DrizzleDidCommDrpcRecordAdapterValues): DidCommDrpcRecord {
    const { customTags, ...remainingValues } = values

    const record = JsonTransformer.fromJSON(remainingValues, DidCommDrpcRecord)
    if (customTags) record.setTags(customTags as TagsBase)

    return record
  }
}
