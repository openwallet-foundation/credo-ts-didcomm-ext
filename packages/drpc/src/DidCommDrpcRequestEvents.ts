import type { BaseEvent } from '@credo-ts/core'
import type { DidCommDrpcRecord } from './repository'

export enum DidCommDrpcRequestEventTypes {
  DidCommDrpcRequestStateChanged = 'DidCommDrpcRequestStateChanged',
}
export interface DidCommDrpcRequestStateChangedEvent extends BaseEvent {
  type: typeof DidCommDrpcRequestEventTypes.DidCommDrpcRequestStateChanged
  payload: {
    drpcMessageRecord: DidCommDrpcRecord
  }
}
