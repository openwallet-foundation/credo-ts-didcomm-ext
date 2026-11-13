import type { BaseEvent } from '@credo-ts/core'
import type { DidCommActionMenuState } from './DidCommActionMenuState'
import type { DidCommActionMenuRecord } from './repository'

/**
 * @public
 */
export enum DidCommActionMenuEventTypes {
  DidCommActionMenuStateChanged = 'DidCommActionMenuStateChanged',
}

/**
 * @public
 */
export interface DidCommActionMenuStateChangedEvent extends BaseEvent {
  type: typeof DidCommActionMenuEventTypes.DidCommActionMenuStateChanged
  payload: {
    actionMenuRecord: DidCommActionMenuRecord
    previousState: DidCommActionMenuState | null
  }
}
