import type { AgentContext, DependencyManager, Module } from '@credo-ts/core'

import { DidCommFeatureRegistry, DidCommMessageHandlerRegistry, DidCommProtocol } from '@credo-ts/didcomm'

import { DidCommDrpcApi } from './DidCommDrpcApi'
import { DidCommDrpcRequestHandler, DidCommDrpcResponseHandler } from './handlers'
import { DidCommDrpcRole } from './models/DidCommDrpcRole'
import { DidCommDrpcRepository } from './repository'
import { DidCommDrpcService } from './services'

export class DidCommDrpcModule implements Module {
  public readonly api = DidCommDrpcApi

  /**
   * Registers the dependencies of the drpc message module on the dependency manager.
   */
  public register(dependencyManager: DependencyManager) {
    // Services
    dependencyManager.registerSingleton(DidCommDrpcService)

    // Repositories
    dependencyManager.registerSingleton(DidCommDrpcRepository)
  }

  public async initialize(agentContext: AgentContext): Promise<void> {
    const featureRegistry = agentContext.dependencyManager.resolve(DidCommFeatureRegistry)
    const messageHandlerRegistry = agentContext.resolve(DidCommMessageHandlerRegistry)
    const drpcMessageService = agentContext.resolve(DidCommDrpcService)

    messageHandlerRegistry.registerMessageHandler(new DidCommDrpcRequestHandler(drpcMessageService))
    messageHandlerRegistry.registerMessageHandler(new DidCommDrpcResponseHandler(drpcMessageService))

    featureRegistry.register(
      new DidCommProtocol({
        id: 'https://didcomm.org/drpc/1.0',
        roles: [DidCommDrpcRole.Client, DidCommDrpcRole.Server],
      })
    )
  }
}
