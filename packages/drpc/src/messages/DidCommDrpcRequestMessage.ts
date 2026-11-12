import { DidCommMessage, IsValidMessageType, parseMessageType } from '@credo-ts/didcomm'
import { Expose } from 'class-transformer'

import { IsValidDrpcRequest } from '../models'

export interface DidCommDrpcRequestObject {
  jsonrpc: string
  method: string
  // biome-ignore lint/suspicious/noExplicitAny: no explanation
  params?: any[] | object
  id: string | number | null
}

export type DidCommDrpcRequest = DidCommDrpcRequestObject | DidCommDrpcRequestObject[]

export class DidCommDrpcRequestMessage extends DidCommMessage {
  public constructor(options: { request: DidCommDrpcRequest }) {
    super()
    if (options) {
      this.id = this.generateId()
      this.request = options.request
    }
  }

  public static readonly type = parseMessageType('https://didcomm.org/drpc/1.0/request')
  @IsValidMessageType(DidCommDrpcRequestMessage.type)
  public readonly type = DidCommDrpcRequestMessage.type.messageTypeUri

  @Expose({ name: 'request' })
  @IsValidDrpcRequest()
  public request!: DidCommDrpcRequest
}
