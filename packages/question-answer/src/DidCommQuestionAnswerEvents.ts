import type { BaseEvent } from '@credo-ts/core'
import type { DidCommQuestionAnswerState } from './models'
import type { DidCommQuestionAnswerRecord } from './repository'

export enum DidCommQuestionAnswerEventTypes {
  DidCommQuestionAnswerStateChanged = 'DidCommQuestionAnswerStateChanged',
}
export interface DidCommQuestionAnswerStateChangedEvent extends BaseEvent {
  type: typeof DidCommQuestionAnswerEventTypes.DidCommQuestionAnswerStateChanged
  payload: {
    previousState: DidCommQuestionAnswerState | null
    questionAnswerRecord: DidCommQuestionAnswerRecord
  }
}
