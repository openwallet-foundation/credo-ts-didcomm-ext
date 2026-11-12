import type { DidCommMessageHandler, DidCommMessageHandlerInboundMessage } from '@credo-ts/didcomm'
import { DidCommPerformMessage } from '../messages'
import type { DidCommActionMenuService } from '../services'

/**
 * @internal
 */
export class DidCommPerformMessageHandler implements DidCommMessageHandler {
  private actionMenuService: DidCommActionMenuService
  public supportedMessages = [DidCommPerformMessage]

  public constructor(actionMenuService: DidCommActionMenuService) {
    this.actionMenuService = actionMenuService
  }

  public async handle(inboundMessage: DidCommMessageHandlerInboundMessage<DidCommPerformMessageHandler>) {
    inboundMessage.assertReadyConnection()

    await this.actionMenuService.processPerform(inboundMessage)

    return undefined
  }
}
