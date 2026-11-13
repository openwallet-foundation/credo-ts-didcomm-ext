import type { DidCommMessageHandler, DidCommMessageHandlerInboundMessage } from '@credo-ts/didcomm'
import { DidCommQuestionMessage } from '../messages'
import type { DidCommQuestionAnswerService } from '../services'

export class DidCommQuestionMessageHandler implements DidCommMessageHandler {
  private questionAnswerService: DidCommQuestionAnswerService
  public supportedMessages = [DidCommQuestionMessage]

  public constructor(questionAnswerService: DidCommQuestionAnswerService) {
    this.questionAnswerService = questionAnswerService
  }

  public async handle(messageContext: DidCommMessageHandlerInboundMessage<DidCommQuestionMessageHandler>) {
    await this.questionAnswerService.processReceiveQuestion(messageContext)

    return undefined
  }
}
