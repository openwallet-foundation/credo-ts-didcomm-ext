import { DidCommMessage, IsValidMessageType, parseMessageType } from '@credo-ts/didcomm'
import { Expose } from 'class-transformer'
import { IsString } from 'class-validator'

export class DidCommAnswerMessage extends DidCommMessage {
  /**
   * Create new DidCommAnswerMessage instance.
   * @param options
   */
  public constructor(options: { id?: string; response: string; threadId: string }) {
    super()

    if (options) {
      this.id = options.id || this.generateId()
      this.setThread({ threadId: options.threadId })
      this.response = options.response
    }
  }

  public static readonly type = parseMessageType('https://didcomm.org/questionanswer/1.0/answer')
  @IsValidMessageType(DidCommAnswerMessage.type)
  public readonly type = DidCommAnswerMessage.type.messageTypeUri

  @Expose({ name: 'response' })
  @IsString()
  public response!: string
}
