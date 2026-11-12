import type { DidCommMessageHandler, DidCommMessageHandlerInboundMessage } from '@credo-ts/didcomm'
import { DidCommActionMenuProblemReportMessage } from '../messages'
import type { DidCommActionMenuService } from '../services'

/**
 * @internal
 */
export class DidCommActionMenuProblemReportHandler implements DidCommMessageHandler {
  private actionMenuService: DidCommActionMenuService
  public supportedMessages = [DidCommActionMenuProblemReportMessage]

  public constructor(actionMenuService: DidCommActionMenuService) {
    this.actionMenuService = actionMenuService
  }

  public async handle(messageContext: DidCommMessageHandlerInboundMessage<DidCommActionMenuProblemReportHandler>) {
    await this.actionMenuService.processProblemReport(messageContext)

    return undefined
  }
}
