import type { DependencyManager } from '@credo-ts/core'
import { DidCommFeatureRegistry, DidCommMessageHandlerRegistry, DidCommProtocol } from '@credo-ts/didcomm'

import { getAgentContext } from '../../../../tests'
import { DidCommActionMenuModule } from '../DidCommActionMenuModule'
import { DidCommActionMenuRole } from '../DidCommActionMenuRole'
import { DidCommActionMenuRepository } from '../repository'
import { DidCommActionMenuService } from '../services'

const featureRegistry = {
  register: vi.fn(),
} as unknown as DidCommFeatureRegistry

const messageHandlerRegistry = new DidCommMessageHandlerRegistry()
const dependencyManager = {
  isRegistered: vi.fn(),
  registerInstance: vi.fn(),
  registerSingleton: vi.fn(),
  registerContextScoped: vi.fn(),
  resolve: (token: unknown) =>
    token === DidCommFeatureRegistry
      ? featureRegistry
      : token === DidCommMessageHandlerRegistry
        ? messageHandlerRegistry
        : {},
} as unknown as DependencyManager

describe('DidCommActionMenuModule', () => {
  test('registers dependencies on the dependency manager', async () => {
    const actionMenuModule = new DidCommActionMenuModule()
    actionMenuModule.register(dependencyManager)

    expect(dependencyManager.registerSingleton).toHaveBeenCalledTimes(2)
    expect(dependencyManager.registerSingleton).toHaveBeenCalledWith(DidCommActionMenuService)
    expect(dependencyManager.registerSingleton).toHaveBeenCalledWith(DidCommActionMenuRepository)
    expect(featureRegistry.register).toHaveBeenCalledTimes(0)

    await actionMenuModule.initialize(getAgentContext({ dependencyManager }))

    expect(featureRegistry.register).toHaveBeenCalledTimes(1)
    expect(featureRegistry.register).toHaveBeenCalledWith(
      new DidCommProtocol({
        id: 'https://didcomm.org/action-menu/1.0',
        roles: [DidCommActionMenuRole.Requester, DidCommActionMenuRole.Responder],
      })
    )
  })
})
