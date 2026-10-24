import type {
  DidCommMessageHandler,
  DidCommMessageHandlerInboundMessage,
  DidCommOutboundMessageContext,
} from '@credo-ts/didcomm'
import { DidCommShareMediaMessage } from '../messages/DidCommShareMediaMessage'
import type { DidCommMediaSharingService } from '../services'

export class DidCommShareMediaHandler implements DidCommMessageHandler {
  public supportedMessages = [DidCommShareMediaMessage]
  private mediaSharingService: DidCommMediaSharingService

  public constructor(mediaSharingService: DidCommMediaSharingService) {
    this.mediaSharingService = mediaSharingService
  }

  public async handle(
    inboundMessage: DidCommMessageHandlerInboundMessage<DidCommShareMediaHandler>
  ): Promise<DidCommOutboundMessageContext | undefined> {
    inboundMessage.assertReadyConnection()
    await this.mediaSharingService.processShareMedia(inboundMessage)
    return
  }
}
