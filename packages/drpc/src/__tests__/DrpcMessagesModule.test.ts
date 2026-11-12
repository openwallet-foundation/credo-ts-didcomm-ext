import type { DependencyManager } from '@credo-ts/core'
import { DidCommFeatureRegistry, DidCommMessageHandlerRegistry, DidCommProtocol } from '@credo-ts/didcomm'
import { getAgentConfig, getAgentContext } from '../../../../tests'
import { DidCommDrpcModule } from '../DidCommDrpcModule'
import { DidCommDrpcRole } from '../models'
import { DidCommDrpcRepository } from '../repository'
import { DidCommDrpcService } from '../services'

describe('DidCommDrpcModule', () => {
  test('registers dependencies on the dependency manager', () => {
    const dependencyManager = {
      registerInstance: vi.fn(),
      registerSingleton: vi.fn(),
      registerContextScoped: vi.fn(),
      resolve: () => {
        return getAgentConfig('dprc')
      },
    } as unknown as DependencyManager

    new DidCommDrpcModule().register(dependencyManager)

    expect(dependencyManager.registerSingleton).toHaveBeenCalledTimes(2)
    expect(dependencyManager.registerSingleton).toHaveBeenCalledWith(DidCommDrpcService)
    expect(dependencyManager.registerSingleton).toHaveBeenCalledWith(DidCommDrpcRepository)
  })

  test('registers features on the feature registry', async () => {
    const featureRegistry = new DidCommFeatureRegistry()
    const agentContext = getAgentContext({
      registerInstances: [
        [DidCommFeatureRegistry, featureRegistry],
        [DidCommMessageHandlerRegistry, new DidCommMessageHandlerRegistry()],
        [DidCommDrpcService, {} as DidCommDrpcService],
      ],
    })
    await new DidCommDrpcModule().initialize(agentContext)

    expect(featureRegistry.query({ featureType: 'protocol', match: '*' })).toEqual([
      new DidCommProtocol({
        id: 'https://didcomm.org/drpc/1.0',
        roles: [DidCommDrpcRole.Client, DidCommDrpcRole.Server],
      }),
    ])
  })
})
