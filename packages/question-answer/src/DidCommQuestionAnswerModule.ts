import type { AgentContext, DependencyManager, Module } from '@credo-ts/core'

import { DidCommFeatureRegistry, DidCommMessageHandlerRegistry, DidCommProtocol } from '@credo-ts/didcomm'
import { DidCommQuestionAnswerApi } from './DidCommQuestionAnswerApi'
import { DidCommQuestionAnswerRole } from './DidCommQuestionAnswerRole'
import { DidCommAnswerMessageHandler, DidCommQuestionMessageHandler } from './handlers'
import { DidCommQuestionAnswerRepository } from './repository'
import { DidCommQuestionAnswerService } from './services'

export class DidCommQuestionAnswerModule implements Module {
  public readonly api = DidCommQuestionAnswerApi

  /**
   * Registers the dependencies of the question answer module on the dependency manager.
   */
  public register(dependencyManager: DependencyManager) {
    // Services
    dependencyManager.registerSingleton(DidCommQuestionAnswerService)

    // Repositories
    dependencyManager.registerSingleton(DidCommQuestionAnswerRepository)
  }

  public async initialize(agentContext: AgentContext) {
    // Feature Registry
    const featureRegistry = agentContext.dependencyManager.resolve(DidCommFeatureRegistry)
    const messageHandlerRegistry = agentContext.resolve(DidCommMessageHandlerRegistry)
    const questionAnswerService = agentContext.resolve(DidCommQuestionAnswerService)

    messageHandlerRegistry.registerMessageHandlers([
      new DidCommQuestionMessageHandler(questionAnswerService),
      new DidCommAnswerMessageHandler(questionAnswerService),
    ])

    featureRegistry.register(
      new DidCommProtocol({
        id: 'https://didcomm.org/questionanswer/1.0',
        roles: [DidCommQuestionAnswerRole.Questioner, DidCommQuestionAnswerRole.Responder],
      })
    )
  }
}
