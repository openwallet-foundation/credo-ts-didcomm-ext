import type { BaseEvent } from '@credo-ts/core'
import type { DidCommMediaSharingState } from './model'
import type { DidCommMediaSharingRecord } from './repository'

export enum DidCommMediaSharingEventTypes {
  StateChanged = 'DidCommMediaSharingStateChangedEvent',
}

export interface DidCommMediaSharingStateChangedEvent extends BaseEvent {
  type: DidCommMediaSharingEventTypes.StateChanged
  payload: {
    mediaSharingRecord: DidCommMediaSharingRecord
    previousState: DidCommMediaSharingState | null
  }
}
