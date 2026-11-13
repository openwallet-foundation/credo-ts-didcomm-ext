import type { DidCommMessageHandler, DidCommMessageHandlerInboundMessage } from '@credo-ts/didcomm'
import { DidCommMenuMessage } from '../messages'
import type { DidCommActionMenuService } from '../services'

/**
 * @internal
 */
export class DidCommMenuMessageHandler implements DidCommMessageHandler {
  private actionMenuService: DidCommActionMenuService
  public supportedMessages = [DidCommMenuMessage]

  public constructor(actionMenuService: DidCommActionMenuService) {
    this.actionMenuService = actionMenuService
  }

  public async handle(inboundMessage: DidCommMessageHandlerInboundMessage<DidCommMenuMessageHandler>) {
    inboundMessage.assertReadyConnection()

    await this.actionMenuService.processMenu(inboundMessage)

    return undefined
  }
}
