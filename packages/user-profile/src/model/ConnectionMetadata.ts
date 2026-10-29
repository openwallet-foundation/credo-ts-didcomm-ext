import type { DidCommConnectionRecord } from '@credo-ts/didcomm'
import type { DidCommUserProfileData } from './UserProfile'

export const getConnectionProfile = (record: DidCommConnectionRecord) =>
  record.metadata.get('UserProfile') as DidCommUserProfileData | null

export const setConnectionProfile = (
  record: DidCommConnectionRecord,
  metadata: DidCommUserProfileData | Record<string, unknown>
) => record.metadata.add('UserProfile', metadata)
