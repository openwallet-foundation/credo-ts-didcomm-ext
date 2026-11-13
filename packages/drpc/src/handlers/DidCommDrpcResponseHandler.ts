import type { DidCommMessageHandler, DidCommMessageHandlerInboundMessage } from '@credo-ts/didcomm'
import { DidCommDrpcResponseMessage } from '../messages'
import type { DidCommDrpcService } from '../services/DidCommDrpcService'

export class DidCommDrpcResponseHandler implements DidCommMessageHandler {
  private drpcMessageService: DidCommDrpcService
  public supportedMessages = [DidCommDrpcResponseMessage]

  public constructor(drpcMessageService: DidCommDrpcService) {
    this.drpcMessageService = drpcMessageService
  }

  public async handle(messageContext: DidCommMessageHandlerInboundMessage<DidCommDrpcResponseHandler>) {
    await this.drpcMessageService.receiveResponse(messageContext)

    return undefined
  }
}
