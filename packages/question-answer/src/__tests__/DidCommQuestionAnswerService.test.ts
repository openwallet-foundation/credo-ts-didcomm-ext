import type { AgentConfig, AgentContext, Repository } from '@credo-ts/core'
import { EventEmitter } from '@credo-ts/core'
import { DidCommDidExchangeState, DidCommInboundMessageContext } from '@credo-ts/didcomm'
import type {
  DidCommQuestionAnswerStateChangedEvent,
  DidCommQuestionAnswerValidResponse,
} from '@credo-ts/didcomm-question-answer'
import {
  DidCommAnswerMessage,
  DidCommQuestionAnswerEventTypes,
  DidCommQuestionAnswerRecord,
  DidCommQuestionAnswerRepository,
  DidCommQuestionAnswerRole,
  DidCommQuestionAnswerService,
  DidCommQuestionAnswerState,
  DidCommQuestionMessage,
} from '@credo-ts/didcomm-question-answer'
import { agentDependencies } from '@credo-ts/node'
import { Subject } from 'rxjs'
import { getAgentConfig, getAgentContext, getMockConnection, mockFunction } from '../../../../tests/helpers'
import { InMemoryStorageService } from '../../../../tests/InMemoryStorageService'
import type { MockedClassConstructor } from '../../../../tests/types'

vi.mock('../repository/DidCommQuestionAnswerRepository')
const QuestionAnswerRepositoryMock = DidCommQuestionAnswerRepository as MockedClassConstructor<
  typeof DidCommQuestionAnswerRepository
>

describe('DidCommQuestionAnswerService', () => {
  const mockConnectionRecord = getMockConnection({
    id: 'd3849ac3-c981-455b-a1aa-a10bea6cead8',
    did: 'did:sov:C2SsBf5QUQpqSAQfhu3sd2',
    state: DidCommDidExchangeState.Completed,
  })

  let agentConfig: AgentConfig
  let questionAnswerRepository: Repository<DidCommQuestionAnswerRecord>
  let questionAnswerService: DidCommQuestionAnswerService
  let eventEmitter: EventEmitter
  let agentContext: AgentContext

  const mockQuestionAnswerRecord = (options: {
    questionText: string
    questionDetail?: string
    connectionId: string
    role: DidCommQuestionAnswerRole
    signatureRequired: boolean
    state: DidCommQuestionAnswerState
    threadId: string
    validResponses: DidCommQuestionAnswerValidResponse[]
  }) => {
    return new DidCommQuestionAnswerRecord({
      questionText: options.questionText,
      questionDetail: options.questionDetail,
      connectionId: options.connectionId,
      role: options.role,
      signatureRequired: options.signatureRequired,
      state: options.state,
      threadId: options.threadId,
      validResponses: options.validResponses,
    })
  }

  beforeAll(async () => {
    agentConfig = getAgentConfig('QuestionAnswerServiceTest')
    agentContext = getAgentContext({
      registerInstances: [[InMemoryStorageService, new InMemoryStorageService()]],
    })
  })

  beforeEach(async () => {
    questionAnswerRepository = new QuestionAnswerRepositoryMock()
    eventEmitter = new EventEmitter(agentDependencies, new Subject())
    questionAnswerService = new DidCommQuestionAnswerService(questionAnswerRepository, eventEmitter, agentConfig.logger)
  })

  describe('create question', () => {
    it('emits a question with question text, valid responses, and question answer record', async () => {
      const eventListenerMock = vi.fn()
      eventEmitter.on<DidCommQuestionAnswerStateChangedEvent>(
        DidCommQuestionAnswerEventTypes.DidCommQuestionAnswerStateChanged,
        eventListenerMock
      )

      const questionMessage = new DidCommQuestionMessage({
        questionText: 'Alice, are you on the phone with Bob?',
        signatureRequired: false,
        validResponses: [{ text: 'Yes' }, { text: 'No' }],
      })

      await questionAnswerService.createQuestion(agentContext, mockConnectionRecord.id, {
        question: questionMessage.questionText,
        validResponses: questionMessage.validResponses,
      })

      expect(eventListenerMock).toHaveBeenCalledWith({
        type: 'DidCommQuestionAnswerStateChanged',
        metadata: {
          contextCorrelationId: 'mock',
        },
        payload: {
          previousState: null,
          questionAnswerRecord: expect.objectContaining({
            connectionId: mockConnectionRecord.id,
            questionText: questionMessage.questionText,
            role: DidCommQuestionAnswerRole.Questioner,
            state: DidCommQuestionAnswerState.QuestionSent,
            validResponses: questionMessage.validResponses,
          }),
        },
      })
    })
  })
  describe('create answer', () => {
    let mockRecord: DidCommQuestionAnswerRecord

    beforeAll(() => {
      mockRecord = mockQuestionAnswerRecord({
        questionText: 'Alice, are you on the phone with Bob?',
        connectionId: mockConnectionRecord.id,
        role: DidCommQuestionAnswerRole.Responder,
        signatureRequired: false,
        state: DidCommQuestionAnswerState.QuestionReceived,
        threadId: '123',
        validResponses: [{ text: 'Yes' }, { text: 'No' }],
      })
    })

    it('throws an error when invalid response is provided', async () => {
      await expect(questionAnswerService.createAnswer(agentContext, mockRecord, 'Maybe')).rejects.toThrow(
        'Response does not match valid responses'
      )
    })

    it('emits an answer with a valid response and question answer record', async () => {
      const eventListenerMock = vi.fn()
      eventEmitter.on<DidCommQuestionAnswerStateChangedEvent>(
        DidCommQuestionAnswerEventTypes.DidCommQuestionAnswerStateChanged,
        eventListenerMock
      )

      mockFunction(questionAnswerRepository.findSingleByQuery).mockReturnValue(Promise.resolve(mockRecord))

      await questionAnswerService.createAnswer(agentContext, mockRecord, 'Yes')

      expect(eventListenerMock).toHaveBeenCalledWith({
        type: 'DidCommQuestionAnswerStateChanged',
        metadata: {
          contextCorrelationId: 'mock',
        },
        payload: {
          previousState: DidCommQuestionAnswerState.QuestionReceived,
          questionAnswerRecord: expect.objectContaining({
            connectionId: mockConnectionRecord.id,
            role: DidCommQuestionAnswerRole.Responder,
            state: DidCommQuestionAnswerState.AnswerSent,
            response: 'Yes',
          }),
        },
      })
    })
  })

  describe('processReceiveQuestion', () => {
    let mockRecord: DidCommQuestionAnswerRecord

    beforeAll(() => {
      mockRecord = mockQuestionAnswerRecord({
        questionText: 'Alice, are you on the phone with Bob?',
        connectionId: mockConnectionRecord.id,
        role: DidCommQuestionAnswerRole.Responder,
        signatureRequired: false,
        state: DidCommQuestionAnswerState.QuestionReceived,
        threadId: '123',
        validResponses: [{ text: 'Yes' }, { text: 'No' }],
      })
    })

    it('creates record when no previous question with that thread exists', async () => {
      const questionMessage = new DidCommQuestionMessage({
        questionText: 'Alice, are you on the phone with Bob?',
        validResponses: [{ text: 'Yes' }, { text: 'No' }],
      })

      const messageContext = new DidCommInboundMessageContext(questionMessage, {
        agentContext,
        connection: mockConnectionRecord,
      })

      mockFunction(questionAnswerRepository.findSingleByQuery).mockResolvedValueOnce(null)
      const questionAnswerRecord = await questionAnswerService.processReceiveQuestion(messageContext)

      expect(questionAnswerRecord).toMatchObject(
        expect.objectContaining({
          role: DidCommQuestionAnswerRole.Responder,
          state: DidCommQuestionAnswerState.QuestionReceived,
          threadId: questionMessage.id,
          questionText: 'Alice, are you on the phone with Bob?',
          validResponses: [{ text: 'Yes' }, { text: 'No' }],
        })
      )
    })

    it('throws an error when question from the same thread exists ', async () => {
      mockFunction(questionAnswerRepository.findSingleByQuery).mockReturnValue(Promise.resolve(mockRecord))

      const questionMessage = new DidCommQuestionMessage({
        id: '123',
        questionText: 'Alice, are you on the phone with Bob?',
        validResponses: [{ text: 'Yes' }, { text: 'No' }],
      })

      const messageContext = new DidCommInboundMessageContext(questionMessage, {
        agentContext,
        connection: mockConnectionRecord,
      })

      await expect(questionAnswerService.processReceiveQuestion(messageContext)).rejects.toThrow(
        `Question answer record with thread Id ${questionMessage.id} already exists.`
      )
      vi.resetAllMocks()
    })
  })

  describe('receiveAnswer', () => {
    let mockRecord: DidCommQuestionAnswerRecord

    beforeAll(() => {
      mockRecord = mockQuestionAnswerRecord({
        questionText: 'Alice, are you on the phone with Bob?',
        connectionId: mockConnectionRecord.id,
        role: DidCommQuestionAnswerRole.Questioner,
        signatureRequired: false,
        state: DidCommQuestionAnswerState.QuestionReceived,
        threadId: '123',
        validResponses: [{ text: 'Yes' }, { text: 'No' }],
      })
    })

    it('updates state and emits event when valid response is received', async () => {
      mockRecord.state = DidCommQuestionAnswerState.QuestionSent
      mockFunction(questionAnswerRepository.findSingleByQuery).mockReturnValue(Promise.resolve(mockRecord))

      const answerMessage = new DidCommAnswerMessage({
        response: 'Yes',
        threadId: '123',
      })

      const messageContext = new DidCommInboundMessageContext(answerMessage, {
        agentContext,
        connection: mockConnectionRecord,
      })

      const questionAnswerRecord = await questionAnswerService.receiveAnswer(messageContext)

      expect(questionAnswerRecord).toMatchObject(
        expect.objectContaining({
          role: DidCommQuestionAnswerRole.Questioner,
          state: DidCommQuestionAnswerState.AnswerReceived,
          threadId: '123',
          questionText: 'Alice, are you on the phone with Bob?',
          validResponses: [{ text: 'Yes' }, { text: 'No' }],
        })
      )
      vi.resetAllMocks()
    })

    it('throws an error when no existing question is found', async () => {
      const answerMessage = new DidCommAnswerMessage({
        response: 'Yes',
        threadId: '123',
      })

      const messageContext = new DidCommInboundMessageContext(answerMessage, {
        agentContext,
        connection: mockConnectionRecord,
      })

      await expect(questionAnswerService.receiveAnswer(messageContext)).rejects.toThrow(
        `Question Answer record with thread Id ${answerMessage.threadId} not found.`
      )
    })

    it('throws an error when record is in invalid state', async () => {
      mockRecord.state = DidCommQuestionAnswerState.AnswerReceived
      mockFunction(questionAnswerRepository.findSingleByQuery).mockReturnValue(Promise.resolve(mockRecord))

      const answerMessage = new DidCommAnswerMessage({
        response: 'Yes',
        threadId: '123',
      })

      const messageContext = new DidCommInboundMessageContext(answerMessage, {
        agentContext,
        connection: mockConnectionRecord,
      })

      await expect(questionAnswerService.receiveAnswer(messageContext)).rejects.toThrow(
        `Question answer record is in invalid state ${mockRecord.state}. Valid states are: ${DidCommQuestionAnswerState.QuestionSent}`
      )
      vi.resetAllMocks()
    })

    it('throws an error when record is in invalid role', async () => {
      mockRecord.state = DidCommQuestionAnswerState.QuestionSent
      mockRecord.role = DidCommQuestionAnswerRole.Responder
      mockFunction(questionAnswerRepository.findSingleByQuery).mockReturnValue(Promise.resolve(mockRecord))

      const answerMessage = new DidCommAnswerMessage({
        response: 'Yes',
        threadId: '123',
      })

      const messageContext = new DidCommInboundMessageContext(answerMessage, {
        agentContext,
        connection: mockConnectionRecord,
      })

      await expect(questionAnswerService.receiveAnswer(messageContext)).rejects.toThrow(
        `Invalid question answer record role ${mockRecord.role}, expected is ${DidCommQuestionAnswerRole.Questioner}`
      )
    })
    vi.resetAllMocks()
  })
})
