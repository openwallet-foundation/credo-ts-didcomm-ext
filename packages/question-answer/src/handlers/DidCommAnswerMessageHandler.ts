import type { DidCommMessageHandler, DidCommMessageHandlerInboundMessage } from '@credo-ts/didcomm'
import { DidCommAnswerMessage } from '../messages'
import type { DidCommQuestionAnswerService } from '../services'

export class DidCommAnswerMessageHandler implements DidCommMessageHandler {
  private questionAnswerService: DidCommQuestionAnswerService
  public supportedMessages = [DidCommAnswerMessage]

  public constructor(questionAnswerService: DidCommQuestionAnswerService) {
    this.questionAnswerService = questionAnswerService
  }

  public async handle(messageContext: DidCommMessageHandlerInboundMessage<DidCommAnswerMessageHandler>) {
    await this.questionAnswerService.receiveAnswer(messageContext)

    return undefined
  }
}
