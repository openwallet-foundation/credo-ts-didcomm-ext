import type { DependencyManager } from '@credo-ts/core'
import { DidCommFeatureRegistry, DidCommMessageHandlerRegistry, DidCommProtocol } from '@credo-ts/didcomm'
import {
  DidCommQuestionAnswerModule,
  DidCommQuestionAnswerRepository,
  DidCommQuestionAnswerRole,
  DidCommQuestionAnswerService,
} from '@credo-ts/didcomm-question-answer'
import { getAgentContext } from '../../../../tests'

const featureRegistry = {
  register: vi.fn(),
} as unknown as DidCommFeatureRegistry

const messageHandlerRegistry = new DidCommMessageHandlerRegistry()

const dependencyManager = {
  isRegistered: vi.fn(),
  registerInstance: vi.fn(),
  registerSingleton: vi.fn(),
  registerContextScoped: vi.fn(),
  resolve: (token: unknown) => {
    if (token === DidCommFeatureRegistry) return featureRegistry
    if (token === DidCommMessageHandlerRegistry) return messageHandlerRegistry
    return {}
  },
} as unknown as DependencyManager

describe('DidCommQuestionAnswerModule', () => {
  test('registers dependencies on the dependency manager', async () => {
    const questionAnswerModule = new DidCommQuestionAnswerModule()
    questionAnswerModule.register(dependencyManager)

    expect(dependencyManager.registerSingleton).toHaveBeenCalledTimes(2)
    expect(dependencyManager.registerSingleton).toHaveBeenCalledWith(DidCommQuestionAnswerService)
    expect(dependencyManager.registerSingleton).toHaveBeenCalledWith(DidCommQuestionAnswerRepository)

    await questionAnswerModule.initialize(getAgentContext({ dependencyManager }))
    expect(featureRegistry.register).toHaveBeenCalledTimes(1)
    expect(featureRegistry.register).toHaveBeenCalledWith(
      new DidCommProtocol({
        id: 'https://didcomm.org/questionanswer/1.0',
        roles: [DidCommQuestionAnswerRole.Questioner, DidCommQuestionAnswerRole.Responder],
      })
    )
  })
})
