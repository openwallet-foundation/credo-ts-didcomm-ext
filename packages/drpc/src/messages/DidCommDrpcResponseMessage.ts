import { DidCommMessage, IsValidMessageType, parseMessageType } from '@credo-ts/didcomm'
import { Expose } from 'class-transformer'
import type { DidCommDrpcErrorCode } from '../models'

import { IsValidDrpcResponse } from '../models'

export type DidCommDrpcResponse =
  | DidCommDrpcResponseObject
  | (DidCommDrpcResponseObject | Record<string, never>)[]
  | Record<string, never>

export interface DidCommDrpcResponseError {
  code: DidCommDrpcErrorCode
  message: string
  // biome-ignore lint/suspicious/noExplicitAny: no explanation
  data?: any
}

export interface DidCommDrpcResponseObject {
  jsonrpc: string
  // biome-ignore lint/suspicious/noExplicitAny: no explanation
  result?: any
  error?: DidCommDrpcResponseError
  id: string | number | null
}

export class DidCommDrpcResponseMessage extends DidCommMessage {
  public constructor(options: { response: DidCommDrpcResponse; threadId: string }) {
    super()
    if (options) {
      this.id = this.generateId()
      this.response = options.response
      this.setThread({ threadId: options.threadId })
    }
  }

  public static readonly type = parseMessageType('https://didcomm.org/drpc/1.0/response')
  @IsValidMessageType(DidCommDrpcResponseMessage.type)
  public readonly type = DidCommDrpcResponseMessage.type.messageTypeUri

  @Expose({ name: 'response' })
  @IsValidDrpcResponse()
  public response!: DidCommDrpcResponse
}
