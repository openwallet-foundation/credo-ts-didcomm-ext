import { DidCommMessage, IsValidMessageType, parseMessageType } from '@credo-ts/didcomm'
import { Expose, Type } from 'class-transformer'
import { IsBoolean, IsInstance, IsOptional, IsString, ValidateNested } from 'class-validator'

import { DidCommQuestionAnswerValidResponse } from '../models'

export class DidCommQuestionMessage extends DidCommMessage {
  /**
   * Create new DidCommQuestionMessage instance.
   * @param options
   */
  public constructor(options: {
    questionText: string
    questionDetail?: string
    validResponses: DidCommQuestionAnswerValidResponse[]
    signatureRequired?: boolean
    id?: string
    nonce?: string
  }) {
    super()

    if (options) {
      this.id = options.id || this.generateId()
      this.nonce = options.nonce
      this.questionText = options.questionText
      this.questionDetail = options.questionDetail
      this.signatureRequired = options.signatureRequired
      this.validResponses = options.validResponses
    }
  }

  public static readonly type = parseMessageType('https://didcomm.org/questionanswer/1.0/question')
  @IsValidMessageType(DidCommQuestionMessage.type)
  public readonly type = DidCommQuestionMessage.type.messageTypeUri

  @IsOptional()
  @IsString()
  public nonce?: string

  @IsOptional()
  @IsBoolean()
  @Expose({ name: 'signature_required' })
  public signatureRequired?: boolean

  @Expose({ name: 'valid_responses' })
  @Type(() => DidCommQuestionAnswerValidResponse)
  @ValidateNested({ each: true })
  @IsInstance(DidCommQuestionAnswerValidResponse, { each: true })
  public validResponses!: DidCommQuestionAnswerValidResponse[]

  @Expose({ name: 'question_text' })
  @IsString()
  public questionText!: string

  @IsOptional()
  @Expose({ name: 'question_detail' })
  @IsString()
  public questionDetail?: string
}
