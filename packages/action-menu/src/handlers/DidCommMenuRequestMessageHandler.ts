import type { DidCommMessageHandler, DidCommMessageHandlerInboundMessage } from '@credo-ts/didcomm'
import { DidCommMenuRequestMessage } from '../messages'
import type { DidCommActionMenuService } from '../services'

/**
 * @internal
 */
export class DidCommMenuRequestMessageHandler implements DidCommMessageHandler {
  private actionMenuService: DidCommActionMenuService
  public supportedMessages = [DidCommMenuRequestMessage]

  public constructor(actionMenuService: DidCommActionMenuService) {
    this.actionMenuService = actionMenuService
  }

  public async handle(inboundMessage: DidCommMessageHandlerInboundMessage<DidCommMenuRequestMessageHandler>) {
    inboundMessage.assertReadyConnection()

    await this.actionMenuService.processRequest(inboundMessage)

    return undefined
  }
}
