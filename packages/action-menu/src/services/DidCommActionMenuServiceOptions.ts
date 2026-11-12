import type { DidCommConnectionRecord } from '@credo-ts/didcomm'
import type { DidCommActionMenuRole } from '../DidCommActionMenuRole'
import type { DidCommActionMenuSelection } from '../models'
import type { DidCommActionMenu } from '../models/DidCommActionMenu'
import type { DidCommActionMenuRecord } from '../repository'

/**
 * @internal
 */
export interface CreateRequestOptions {
  connection: DidCommConnectionRecord
}

/**
 * @internal
 */
export interface CreateMenuOptions {
  connection: DidCommConnectionRecord
  menu: DidCommActionMenu
}

/**
 * @internal
 */
export interface CreatePerformOptions {
  actionMenuRecord: DidCommActionMenuRecord
  performedAction: DidCommActionMenuSelection
}

/**
 * @internal
 */
export interface ClearMenuOptions {
  actionMenuRecord: DidCommActionMenuRecord
}

/**
 * @internal
 */
export interface FindMenuOptions {
  connectionId: string
  role: DidCommActionMenuRole
  threadId?: string
}
