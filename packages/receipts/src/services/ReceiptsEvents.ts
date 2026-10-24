import type { BaseEvent } from '@credo-ts/core'
import type { DidCommMessageReceipt, DidCommRequestedReceipt } from '../messages'

export enum ReceiptsEventTypes {
  MessageReceiptsReceived = 'MessageReceiptsReceived ',
  RequestReceiptsReceived = 'RequestReceiptsReceived ',
}

export interface MessageReceiptsReceivedEvent extends BaseEvent {
  type: ReceiptsEventTypes.MessageReceiptsReceived
  payload: {
    connectionId: string
    receipts: DidCommMessageReceipt[]
  }
}

export interface RequestReceiptsReceivedEvent extends BaseEvent {
  type: ReceiptsEventTypes.RequestReceiptsReceived
  payload: {
    connectionId: string
    requestedReceipts: DidCommRequestedReceipt[]
  }
}
