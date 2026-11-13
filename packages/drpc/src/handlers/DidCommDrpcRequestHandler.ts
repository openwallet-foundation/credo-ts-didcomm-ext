import type { DidCommMessageHandler, DidCommMessageHandlerInboundMessage } from '@credo-ts/didcomm'
import { DidCommDrpcRequestMessage } from '../messages'
import type { DidCommDrpcService } from '../services/DidCommDrpcService'

export class DidCommDrpcRequestHandler implements DidCommMessageHandler {
  private drpcMessageService: DidCommDrpcService
  public supportedMessages = [DidCommDrpcRequestMessage]

  public constructor(drpcMessageService: DidCommDrpcService) {
    this.drpcMessageService = drpcMessageService
  }

  public async handle(messageContext: DidCommMessageHandlerInboundMessage<DidCommDrpcRequestHandler>) {
    await this.drpcMessageService.receiveRequest(messageContext)

    return undefined
  }
}
