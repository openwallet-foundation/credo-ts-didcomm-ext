import { AskarModule } from '@credo-ts/askar'
import type { AgentDependencies, InitConfig, InjectionToken, Module } from '@credo-ts/core'
import { Agent, AgentConfig, AgentContext, DependencyManager, Kms, utils } from '@credo-ts/core'
import type { DidCommConnectionRecordProps, DidCommModuleConfigOptions } from '@credo-ts/didcomm'
import {
  DidCommConnectionRecord,
  DidCommDidExchangeRole,
  DidCommDidExchangeState,
  DidCommHandshakeProtocol,
  DidCommModule,
} from '@credo-ts/didcomm'
import { agentDependencies, NodeInMemoryKeyManagementStorage, NodeKeyManagementService } from '@credo-ts/node'
import { askarNodeJS } from '@openwallet-foundation/askar-nodejs'
import type { Observable } from 'rxjs'
import { firstValueFrom } from 'rxjs'
import type { MockedFunction } from 'vitest'
import { testLogger } from './logger'

export { agentDependencies }

export function getAskarStoreConfig(name: string, inMemory = true) {
  return {
    id: `Wallet: ${name} - ${utils.uuid().slice(0, 4)}`,
    key: 'DZ9hPqFWTPxemcGea72C1X1nusqk5wFNLq6QPjwXGqAa',
    keyDerivationMethod: 'raw',
    database: {
      type: 'sqlite',
      config: {
        inMemory,
      },
    },
  } as const
}

/**
 * Returns the options for an agent with the DIDComm module, an in-memory Askar store, and the given modules.
 * The signature matches the helper in the credo-ts repository, so that the moved tests need no change.
 */
export function getAgentOptions<AgentModules extends Record<string, Module>>(
  name: string,
  didcommConfig: DidCommModuleConfigOptions = {},
  extraConfig: Partial<InitConfig> = {},
  inputModules?: AgentModules,
  { inMemory = true }: { requireDidcomm?: boolean; inMemory?: boolean } = {}
): {
  config: InitConfig
  modules: { didcomm: DidCommModule; askar: AskarModule } & AgentModules
  dependencies: AgentDependencies
} {
  const config: InitConfig = {
    logger: testLogger,
    ...extraConfig,
  }

  const modules = {
    didcomm: new DidCommModule({
      connections: {
        autoAcceptConnections: true,
      },
      ...didcommConfig,
    }),
    askar: new AskarModule({
      askar: askarNodeJS,
      store: getAskarStoreConfig(name, inMemory),
    }),
    ...(inputModules ?? ({} as AgentModules)),
  }

  return {
    config,
    modules,
    dependencies: agentDependencies,
  }
}

export function getAgentConfig(
  _name: string,
  _didcommConfig: Partial<DidCommModuleConfigOptions> = {},
  extraConfig: Partial<InitConfig> = {}
): AgentConfig {
  return new AgentConfig({ logger: testLogger, ...extraConfig }, agentDependencies)
}

export function getAgentContext({
  dependencyManager = new DependencyManager(),
  agentConfig,
  contextCorrelationId = 'mock',
  registerInstances = [],
  kmsBackends = [new NodeKeyManagementService(new NodeInMemoryKeyManagementStorage())],
  isRootAgentContext = true,
  isInitialized = true,
}: {
  dependencyManager?: DependencyManager
  agentConfig?: AgentConfig
  contextCorrelationId?: string
  kmsBackends?: Kms.KeyManagementService[]
  // Must be an array of arrays as objects can't have injection tokens
  // as keys (it must be number, string or symbol)
  registerInstances?: Array<[InjectionToken, unknown]>
  isRootAgentContext?: boolean
  isInitialized?: boolean
} = {}) {
  const config = agentConfig ?? new AgentConfig({ logger: testLogger }, agentDependencies)
  if (!dependencyManager.isRegistered(AgentConfig)) {
    dependencyManager.registerInstance(AgentConfig, config)
  }

  // Register custom instances on the dependency manager
  for (const [token, instance] of registerInstances.values()) {
    dependencyManager.registerInstance(token, instance)
  }

  const agentContext = new AgentContext({ dependencyManager, contextCorrelationId, isRootAgentContext })
  agentContext.isInitialized = isInitialized
  agentContext.dependencyManager.registerInstance(
    Kms.KeyManagementModuleConfig,
    new Kms.KeyManagementModuleConfig({
      backends: kmsBackends,
    })
  )
  agentContext.dependencyManager.registerContextScoped(Kms.KeyManagementApi)

  agentContext.dependencyManager.registerInstance(AgentContext, agentContext)
  return agentContext
}

export async function firstValueWithStackTrace<T>(source: Observable<T>): Promise<T> {
  try {
    return await firstValueFrom(source)
  } catch (error) {
    // Errors from rxjs have a weird stack trace that doesn't lead to the original caller
    // So we update the stack trace
    Error.captureStackTrace(error as object)
    throw error
  }
}

export function getMockConnection({
  state = DidCommDidExchangeState.InvitationReceived,
  role = DidCommDidExchangeRole.Requester,
  id = 'test',
  did = 'test-did',
  threadId = 'threadId',
  tags = {},
  theirLabel,
  theirDid = 'their-did',
}: Partial<DidCommConnectionRecordProps> = {}) {
  return new DidCommConnectionRecord({
    did,
    threadId,
    theirDid,
    id,
    role,
    state,
    tags,
    theirLabel,
  })
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export async function makeConnection(
  // biome-ignore lint/suspicious/noExplicitAny: no explanation
  agentA: Agent<{ didcomm: DidCommModule<any> }>,
  // biome-ignore lint/suspicious/noExplicitAny: no explanation
  agentB: Agent<{ didcomm: DidCommModule<any> }>
): Promise<[DidCommConnectionRecord, DidCommConnectionRecord]> {
  const agentAOutOfBand = await agentA.didcomm.oob.createInvitation({
    handshakeProtocols: [DidCommHandshakeProtocol.DidExchange],
  })

  const { connectionRecord: agentBConnection, outOfBandRecord: agentBOutOfBand } =
    await agentB.didcomm.oob.receiveInvitation(agentAOutOfBand.outOfBandInvitation, {
      label: '',
    })

  const agentBConnectionId =
    agentBConnection?.id ?? (await agentB.didcomm.connections.findAllByOutOfBandId(agentBOutOfBand.id))[0]?.id
  if (!agentBConnectionId) {
    throw new Error('makeConnection: No connection record created for agent B.')
  }

  const agentBConnectionResolved = await agentB.didcomm.connections.returnWhenIsConnected(agentBConnectionId)

  // Agent A's connection is created when A receives B's connection request. With the Subject transport
  // there can be a short delay, so poll for up to 5 seconds.
  let agentAConnectionFromFind: DidCommConnectionRecord | undefined
  for (let i = 0; i < 25; i++) {
    const found = await agentA.didcomm.connections.findAllByOutOfBandId(agentAOutOfBand.id)
    if (found.length > 0) {
      agentAConnectionFromFind = found[0]
      break
    }
    await sleep(200)
  }
  const agentAConnectionId = agentAConnectionFromFind?.id
  if (!agentAConnectionId) {
    throw new Error('makeConnection: No connection record found for agent A.')
  }
  const agentAConnection = await agentA.didcomm.connections.returnWhenIsConnected(agentAConnectionId)

  return [agentAConnection, agentBConnectionResolved]
}

/**
 * Returns mock of function with correct type annotations according to original function `fn`.
 * It can be used also for class methods.
 */
// biome-ignore lint/suspicious/noExplicitAny: no explanation
export function mockFunction<T extends (...args: any[]) => any>(fn: T): MockedFunction<T> {
  return fn as MockedFunction<T>
}
