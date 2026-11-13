import type { Agent } from '@credo-ts/core'
import type {
  DidCommQuestionAnswerRole,
  DidCommQuestionAnswerState,
  DidCommQuestionAnswerStateChangedEvent,
} from '@credo-ts/didcomm-question-answer'
import { DidCommQuestionAnswerEventTypes } from '@credo-ts/didcomm-question-answer'
import type { Observable } from 'rxjs'
import { catchError, filter, map, ReplaySubject, timeout } from 'rxjs'
import { firstValueWithStackTrace } from '../../../tests/helpers'

export async function waitForQuestionAnswerRecord(
  agent: Agent,
  options: {
    threadId?: string
    role?: DidCommQuestionAnswerRole
    state?: DidCommQuestionAnswerState
    previousState?: DidCommQuestionAnswerState | null
    timeoutMs?: number
  }
) {
  const observable = agent.events.observable<DidCommQuestionAnswerStateChangedEvent>(
    DidCommQuestionAnswerEventTypes.DidCommQuestionAnswerStateChanged
  )

  return waitForQuestionAnswerRecordSubject(observable, options)
}

export function waitForQuestionAnswerRecordSubject(
  subject: ReplaySubject<DidCommQuestionAnswerStateChangedEvent> | Observable<DidCommQuestionAnswerStateChangedEvent>,
  {
    threadId,
    role,
    state,
    previousState,
    timeoutMs = 10000,
  }: {
    threadId?: string
    role?: DidCommQuestionAnswerRole
    state?: DidCommQuestionAnswerState
    previousState?: DidCommQuestionAnswerState | null
    timeoutMs?: number
  }
) {
  const observable = subject instanceof ReplaySubject ? subject.asObservable() : subject
  return firstValueWithStackTrace(
    observable.pipe(
      filter((e) => previousState === undefined || e.payload.previousState === previousState),
      filter((e) => threadId === undefined || e.payload.questionAnswerRecord.threadId === threadId),
      filter((e) => role === undefined || e.payload.questionAnswerRecord.role === role),
      filter((e) => state === undefined || e.payload.questionAnswerRecord.state === state),
      timeout(timeoutMs),
      catchError(() => {
        throw new Error(
          `QuestionAnswerChangedEvent event not emitted within specified timeout: {
    previousState: ${previousState},
    threadId: ${threadId},
    state: ${state}
  }`
        )
      }),
      map((e) => e.payload.questionAnswerRecord)
    )
  )
}
