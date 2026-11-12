import type { DidCommActionMenuRole } from './DidCommActionMenuRole'
import type { DidCommActionMenu, DidCommActionMenuSelection } from './models'

/**
 * @public
 */
export interface FindActiveMenuOptions {
  connectionId: string
  role: DidCommActionMenuRole
}

/**
 * @public
 */
export interface ClearActiveMenuOptions {
  connectionId: string
  role: DidCommActionMenuRole
}

/**
 * @public
 */
export interface RequestMenuOptions {
  connectionId: string
}

/**
 * @public
 */
export interface SendMenuOptions {
  connectionId: string
  menu: DidCommActionMenu
}

/**
 * @public
 */
export interface DidCommPerformActionOptions {
  connectionId: string
  performedAction: DidCommActionMenuSelection
}
