import { getPostgresBaseRecordTable, postgresBaseRecordIndexes } from '@credo-ts/drizzle-storage'
import { jsonb, pgTable, text } from 'drizzle-orm/pg-core'
import type { PictureData } from '../../index'

export const didcommUserProfile = pgTable(
  'DidcommUserProfile',
  {
    ...getPostgresBaseRecordTable(),

    displayName: text('display_name'),
    displayPicture: jsonb('display_picture').$type<PictureData | ''>(),
    displayIcon: jsonb('display_icon').$type<PictureData | ''>(),
    description: text(),
    preferredLanguage: text('preferred_language'),
  },
  (table) => [...postgresBaseRecordIndexes(table, 'didcommUserProfile')]
)
