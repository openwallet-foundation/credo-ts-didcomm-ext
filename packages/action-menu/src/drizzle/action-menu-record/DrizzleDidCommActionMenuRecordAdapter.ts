import { JsonTransformer, type TagsBase } from '@credo-ts/core'
import {
  BaseDrizzleRecordAdapter,
  type DrizzleAdapterRecordValues,
  type DrizzleDatabase,
} from '@credo-ts/drizzle-storage'
import { type DidCommActionMenuOptions, type DidCommActionMenuSelectionOptions } from '../../models'
import { DidCommActionMenuRecord } from '../../repository/DidCommActionMenuRecord'
import * as postgres from './postgres'
import * as sqlite from './sqlite'

type DrizzleDidCommActionMenuRecordAdapterValues = DrizzleAdapterRecordValues<(typeof sqlite)['didcommActionMenu']>

export class DrizzleDidCommActionMenuRecordAdapter extends BaseDrizzleRecordAdapter<
  DidCommActionMenuRecord,
  typeof postgres.didcommActionMenu,
  typeof postgres,
  typeof sqlite.didcommActionMenu,
  typeof sqlite
> {
  public constructor(database: DrizzleDatabase<typeof postgres, typeof sqlite>) {
    super(database, { postgres: postgres.didcommActionMenu, sqlite: sqlite.didcommActionMenu }, DidCommActionMenuRecord)
  }

  public getValues(record: DidCommActionMenuRecord) {
    const { role, connectionId, threadId, ...customTags } = record.getTags()

    return {
      role,
      threadId,
      connectionId,
      state: record.state,
      menu: record.menu ? (JsonTransformer.toJSON(record.menu) as DidCommActionMenuOptions) : null,
      performedAction: record.performedAction
        ? (JsonTransformer.toJSON(record.performedAction) as DidCommActionMenuSelectionOptions)
        : null,
      customTags,
    }
  }

  public toRecord(values: DrizzleDidCommActionMenuRecordAdapterValues): DidCommActionMenuRecord {
    const { customTags, ...remainingValues } = values

    const record = JsonTransformer.fromJSON(remainingValues, DidCommActionMenuRecord)
    if (customTags) record.setTags(customTags as TagsBase)

    return record
  }
}
