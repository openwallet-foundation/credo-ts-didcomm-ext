import type { BaseEvent } from '@credo-ts/core'
import type { DidCommDrpcRecord } from './repository'

export enum DidCommDrpcResponseEventTypes {
  DidCommDrpcResponseStateChanged = 'DidCommDrpcResponseStateChanged',
}
export interface DidCommDrpcResponseStateChangedEvent extends BaseEvent {
  type: typeof DidCommDrpcResponseEventTypes.DidCommDrpcResponseStateChanged
  payload: {
    drpcMessageRecord: DidCommDrpcRecord
  }
}
