import type { BaseEvent } from '@credo-ts/core'
import type { DidCommMessageReaction } from './messages'

export enum DidCommReactionsEventTypes {
  DidCommMessageReactionsReceived = 'DidCommMessageReactionsReceived',
}

export interface DidCommMessageReactionsReceivedEvent extends BaseEvent {
  type: DidCommReactionsEventTypes.DidCommMessageReactionsReceived
  payload: {
    connectionId: string
    reactions: DidCommMessageReaction[]
  }
}
