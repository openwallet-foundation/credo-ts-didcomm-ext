import type { RecordTags, TagsBase } from '@credo-ts/core'
import { BaseRecord, CredoError, utils } from '@credo-ts/core'
import type { DidCommQuestionAnswerRole } from '../DidCommQuestionAnswerRole'
import type { DidCommQuestionAnswerState, DidCommQuestionAnswerValidResponse } from '../models'

export type CustomDidCommQuestionAnswerTags = TagsBase
export type DefaultDidCommQuestionAnswerTags = {
  connectionId: string
  role: DidCommQuestionAnswerRole
  state: DidCommQuestionAnswerState
  threadId: string
}

export type DidCommQuestionAnswerTags = RecordTags<DidCommQuestionAnswerRecord>

export interface DidCommQuestionAnswerStorageProps {
  id?: string
  createdAt?: Date
  connectionId: string
  role: DidCommQuestionAnswerRole
  signatureRequired: boolean
  state: DidCommQuestionAnswerState
  tags?: CustomDidCommQuestionAnswerTags
  threadId: string

  questionText: string
  questionDetail?: string
  validResponses: DidCommQuestionAnswerValidResponse[]

  response?: string
}

export class DidCommQuestionAnswerRecord extends BaseRecord<
  DefaultDidCommQuestionAnswerTags,
  CustomDidCommQuestionAnswerTags
> {
  public questionText!: string
  public questionDetail?: string
  public validResponses!: DidCommQuestionAnswerValidResponse[]
  public connectionId!: string
  public role!: DidCommQuestionAnswerRole
  public signatureRequired!: boolean
  public state!: DidCommQuestionAnswerState
  public threadId!: string
  public response?: string

  public static readonly type = 'QuestionAnswerRecord'
  public readonly type = DidCommQuestionAnswerRecord.type

  public constructor(props: DidCommQuestionAnswerStorageProps) {
    super()

    if (props) {
      this.id = props.id ?? utils.uuid()
      this.createdAt = props.createdAt ?? new Date()
      this.questionText = props.questionText
      this.questionDetail = props.questionDetail
      this.validResponses = props.validResponses
      this.connectionId = props.connectionId
      this._tags = props.tags ?? {}
      this.role = props.role
      this.signatureRequired = props.signatureRequired
      this.state = props.state
      this.threadId = props.threadId
      this.response = props.response
    }
  }

  public getTags() {
    return {
      ...this._tags,
      connectionId: this.connectionId,
      role: this.role,
      state: this.state,
      threadId: this.threadId,
    }
  }

  public assertRole(expectedRole: DidCommQuestionAnswerRole) {
    if (this.role !== expectedRole) {
      throw new CredoError(`Invalid question answer record role ${this.role}, expected is ${expectedRole}.`)
    }
  }

  public assertState(expectedStates: DidCommQuestionAnswerState | DidCommQuestionAnswerState[]) {
    if (!Array.isArray(expectedStates)) {
      expectedStates = [expectedStates]
    }

    if (!expectedStates.includes(this.state)) {
      throw new CredoError(
        `Question answer record is in invalid state ${this.state}. Valid states are: ${expectedStates.join(', ')}.`
      )
    }
  }
}
