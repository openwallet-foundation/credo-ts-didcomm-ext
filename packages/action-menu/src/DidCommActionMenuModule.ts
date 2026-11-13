import type { AgentContext, DependencyManager, Module } from '@credo-ts/core'

import { DidCommFeatureRegistry, DidCommMessageHandlerRegistry, DidCommProtocol } from '@credo-ts/didcomm'

import { DidCommActionMenuApi } from './DidCommActionMenuApi'
import {
  DidCommActionMenuModuleConfig,
  type DidCommActionMenuModuleConfigOptions,
} from './DidCommActionMenuModuleConfig'
import { DidCommActionMenuRole } from './DidCommActionMenuRole'
import {
  DidCommActionMenuProblemReportHandler,
  DidCommMenuMessageHandler,
  DidCommMenuRequestMessageHandler,
  DidCommPerformMessageHandler,
} from './handlers'
import { DidCommActionMenuRepository } from './repository'
import { DidCommActionMenuService } from './services'

/**
 * @public
 */
export class DidCommActionMenuModule implements Module {
  public readonly api = DidCommActionMenuApi
  public readonly config: DidCommActionMenuModuleConfig

  public constructor(config?: DidCommActionMenuModuleConfigOptions) {
    this.config = new DidCommActionMenuModuleConfig(config ?? {})
  }

  /**
   * Registers the dependencies of the question answer module on the dependency manager.
   */
  public register(dependencyManager: DependencyManager) {
    dependencyManager.registerInstance(DidCommActionMenuModuleConfig, this.config)

    // Services
    dependencyManager.registerSingleton(DidCommActionMenuService)

    // Repositories
    dependencyManager.registerSingleton(DidCommActionMenuRepository)
  }

  public async initialize(agentContext: AgentContext): Promise<void> {
    const featureRegistry = agentContext.resolve(DidCommFeatureRegistry)
    const messageHandlerRegistry = agentContext.resolve(DidCommMessageHandlerRegistry)
    const actionMenuService = agentContext.resolve(DidCommActionMenuService)

    messageHandlerRegistry.registerMessageHandlers([
      new DidCommActionMenuProblemReportHandler(actionMenuService),
      new DidCommMenuMessageHandler(actionMenuService),
      new DidCommMenuRequestMessageHandler(actionMenuService),
      new DidCommPerformMessageHandler(actionMenuService),
    ])

    featureRegistry.register(
      new DidCommProtocol({
        id: 'https://didcomm.org/action-menu/1.0',
        roles: [DidCommActionMenuRole.Requester, DidCommActionMenuRole.Responder],
      })
    )
  }
}
