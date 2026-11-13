import { getSqliteBaseRecordTable, sqliteBaseRecordIndexes } from '@credo-ts/drizzle-storage'
import { sqliteTable, text } from 'drizzle-orm/sqlite-core'
import type { PictureData } from '../../index'

export const didcommUserProfile = sqliteTable(
  'DidcommUserProfile',
  {
    ...getSqliteBaseRecordTable(),

    displayName: text('display_name'),
    displayPicture: text('display_picture', { mode: 'json' }).$type<PictureData | ''>(),
    displayIcon: text('display_icon', { mode: 'json' }).$type<PictureData | ''>(),
    description: text(),
    preferredLanguage: text('preferred_language'),
  },
  (table) => [...sqliteBaseRecordIndexes(table, 'didcommUserProfile')]
)
