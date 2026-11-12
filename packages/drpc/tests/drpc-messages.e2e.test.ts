import { Agent } from '@credo-ts/core'
import type { DidCommConnectionRecord } from '@credo-ts/didcomm'
import { setupSubjectTransports } from '../../../tests'
import { getAgentOptions, makeConnection } from '../../../tests/helpers'
import { testLogger } from '../../../tests/logger'
import { DidCommDrpcModule } from '../src/DidCommDrpcModule'
import type { DidCommDrpcRequest, DidCommDrpcRequestObject, DidCommDrpcResponseObject } from '../src/messages'
import { DidCommDrpcErrorCode } from '../src/models'

const modules = {
  drpc: new DidCommDrpcModule(),
}

const faberConfig = getAgentOptions(
  'Faber Drpc Messages',
  {
    endpoints: ['rxjs:faber'],
  },
  {},
  modules,
  { requireDidcomm: true }
)

const aliceConfig = getAgentOptions(
  'Alice Drpc Messages',
  {
    endpoints: ['rxjs:alice'],
  },
  {},
  modules,
  { requireDidcomm: true }
)

const handleMessageOrError = async (
  handlers: Map<
    string,
    (message: DidCommDrpcRequestObject) => Promise<DidCommDrpcResponseObject | Record<string, never>>
  >,
  message: DidCommDrpcRequestObject
) => {
  const handler = handlers.get(message.method)
  if (handler) {
    return handler(message)
  }
  return {
    jsonrpc: '2.0',
    id: message.id,
    error: { code: DidCommDrpcErrorCode.METHOD_NOT_FOUND, message: 'Method not found' },
  }
}

const sendAndRecieve = async (
  sender: Agent,
  receiver: Agent,
  connectionRecord: DidCommConnectionRecord,
  message: DidCommDrpcRequestObject,
  messageHandlers: Map<
    string,
    (message: DidCommDrpcRequestObject) => Promise<DidCommDrpcResponseObject | Record<string, never>>
  >
) => {
  const responseListener = await sender.modules.drpc.sendRequest(connectionRecord.id, message)
  const { request, sendResponse } = await receiver.modules.drpc.recvRequest()
  const result = await handleMessageOrError(messageHandlers, request as DidCommDrpcRequestObject)
  await sendResponse(result as DidCommDrpcResponseObject)

  const helloRecord = await responseListener()
  return helloRecord as DidCommDrpcResponseObject
}

const sendAndRecieveBatch = async (
  sender: Agent,
  receiver: Agent,
  connectionRecord: DidCommConnectionRecord,
  message: DidCommDrpcRequestObject[],
  messageHandlers: Map<
    string,
    (message: DidCommDrpcRequestObject) => Promise<DidCommDrpcResponseObject | Record<string, never>>
  >
) => {
  const responseListener = await sender.modules.drpc.sendRequest(connectionRecord.id, message)
  const { request: batchRequest, sendResponse: sendBatchResponse } = await receiver.modules.drpc.recvRequest()
  const batchRequests = batchRequest as DidCommDrpcRequestObject[]
  const batchResults: (DidCommDrpcResponseObject | Record<string, never>)[] = []
  for (const request of batchRequests) {
    batchResults.push(await handleMessageOrError(messageHandlers, request))
  }
  await sendBatchResponse(batchResults)
  const batchRecord = await responseListener()
  return batchRecord as DidCommDrpcResponseObject[]
}

describe('Drpc Messages E2E', () => {
  let faberAgent: Agent
  let aliceAgent: Agent
  let aliceConnection: DidCommConnectionRecord
  let messageHandlers: Map<
    string,
    (message: DidCommDrpcRequestObject) => Promise<DidCommDrpcResponseObject | Record<string, never>>
  >

  beforeEach(async () => {
    faberAgent = new Agent(faberConfig)
    aliceAgent = new Agent(aliceConfig)

    setupSubjectTransports([faberAgent, aliceAgent])

    await faberAgent.initialize()
    await aliceAgent.initialize()
    ;[aliceConnection] = await makeConnection(aliceAgent, faberAgent)

    messageHandlers = new Map()
    messageHandlers.set('hello', async (message: DidCommDrpcRequestObject) => {
      return { jsonrpc: '2.0', result: 'Hello', id: message.id }
    })
    messageHandlers.set('add', async (message) => {
      const operands = message.params as number[]
      const result = operands.reduce((a, b) => a + b, 0)
      return { jsonrpc: '2.0', result, id: message.id }
    })
    messageHandlers.set('parseFoo', async (message) => {
      const params = message.params as { foo: string }
      return { jsonrpc: '2.0', result: params.foo, id: message.id }
    })
  })

  afterEach(async () => {
    await faberAgent.shutdown()
    await aliceAgent.shutdown()
  })

  test('Alice and Faber exchange messages', async () => {
    testLogger.test('Alice sends message to Faber')
    const helloRecord = await sendAndRecieve(
      aliceAgent,
      faberAgent,
      aliceConnection,
      {
        jsonrpc: '2.0',
        method: 'hello',
        id: 1,
      },
      messageHandlers
    )
    expect((helloRecord as DidCommDrpcResponseObject).result).toBe('Hello')

    testLogger.test('Alice sends message with positional parameters to Faber')

    const addRecord = await sendAndRecieve(
      aliceAgent,
      faberAgent,
      aliceConnection,
      {
        jsonrpc: '2.0',
        method: 'add',
        params: [2, 3, 7],
        id: 2,
      },
      messageHandlers
    )

    expect((addRecord as DidCommDrpcResponseObject).result).toBe(12)

    testLogger.test('Alice sends message with keyed parameters to Faber')

    const parseFooRecord = await sendAndRecieve(
      aliceAgent,
      faberAgent,
      aliceConnection,
      {
        jsonrpc: '2.0',
        method: 'parseFoo',
        params: { foo: 'bar' },
        id: 3,
      },
      messageHandlers
    )
    expect((parseFooRecord as DidCommDrpcResponseObject).result).toBe('bar')

    testLogger.test('Alice sends message with invalid method to Faber')

    const errorRecord = await sendAndRecieve(
      aliceAgent,
      faberAgent,
      aliceConnection,
      {
        jsonrpc: '2.0',
        method: 'error',
        id: 4,
      },
      messageHandlers
    )
    expect((errorRecord as DidCommDrpcResponseObject).error).toBeDefined()
    expect((errorRecord as DidCommDrpcResponseObject).error?.code).toBe(DidCommDrpcErrorCode.METHOD_NOT_FOUND)
  })

  test('Alice sends Faber Drpc batch message', async () => {
    testLogger.test('Alice sends batch message to Faber')

    const batchRecord = await sendAndRecieveBatch(
      aliceAgent,
      faberAgent,
      aliceConnection,
      [
        { jsonrpc: '2.0', method: 'hello', id: 1 },
        { jsonrpc: '2.0', method: 'add', params: [2, 3, 7], id: 2 },
        { jsonrpc: '2.0', method: 'parseFoo', params: { foo: 'bar' }, id: 3 },
        { jsonrpc: '2.0', method: 'error', id: 4 },
      ],
      messageHandlers
    )
    expect(batchRecord as DidCommDrpcResponseObject[]).toHaveLength(4)
    expect((batchRecord as DidCommDrpcResponseObject[]).find((item) => item.id === 1)?.result).toBe('Hello')
    expect((batchRecord as DidCommDrpcResponseObject[]).find((item) => item.id === 2)?.result).toBe(12)
    expect((batchRecord as DidCommDrpcResponseObject[]).find((item) => item.id === 3)?.result).toBe('bar')
    expect((batchRecord as DidCommDrpcResponseObject[]).find((item) => item.id === 4)?.error).toBeDefined()
    expect((batchRecord as DidCommDrpcResponseObject[]).find((item) => item.id === 4)?.error?.code).toBe(
      DidCommDrpcErrorCode.METHOD_NOT_FOUND
    )
  })

  test('Alice sends Faber Drpc notification', async () => {
    testLogger.test('Alice sends notification to Faber')
    let notified = false
    messageHandlers.set('notify', async () => {
      notified = true
      return {}
    })
    const notifyRecord = await sendAndRecieve(
      aliceAgent,
      faberAgent,
      aliceConnection,
      {
        jsonrpc: '2.0',
        method: 'notify',
        id: null,
      },
      messageHandlers
    )
    expect(notifyRecord).toMatchObject({})
    expect(notified).toBe(true)

    testLogger.test('Alice sends batch notification to Faber')
    notified = false

    const notifyBatchRecord = await sendAndRecieveBatch(
      aliceAgent,
      faberAgent,
      aliceConnection,
      [
        { jsonrpc: '2.0', method: 'hello', id: 1 },
        { jsonrpc: '2.0', method: 'notify', id: null },
      ],
      messageHandlers
    )
    expect(
      (notifyBatchRecord as (DidCommDrpcResponseObject | Record<string, never>)[]).find(
        (item) => (item as DidCommDrpcResponseObject)?.id === 1
      )
    ).toMatchObject({ jsonrpc: '2.0', result: 'Hello', id: 1 })
    expect(
      (notifyBatchRecord as (DidCommDrpcResponseObject | Record<string, never>)[]).find(
        (item) => !(item as DidCommDrpcResponseObject)?.id
      )
    ).toMatchObject({})
    expect(notified).toBe(true)
  })

  test('Alice sends Faber invalid Drpc message | Faber responds with invalid Drpc message', async () => {
    messageHandlers.set('hello', async () => {
      return [] as unknown as DidCommDrpcResponseObject
    })
    let error = false
    try {
      await aliceAgent.modules.drpc.sendRequest(aliceConnection.id, 'test' as unknown as DidCommDrpcRequest)
    } catch {
      error = true
    }
    expect(error).toBe(true)
    await aliceAgent.modules.drpc.sendRequest(aliceConnection.id, {
      jsonrpc: '2.0',
      method: 'hello',
      id: 1,
    })
    const { request, sendResponse } = await faberAgent.modules.drpc.recvRequest()
    const result = await handleMessageOrError(messageHandlers, request as DidCommDrpcRequestObject)
    let responseError = false
    try {
      await sendResponse(result as DidCommDrpcResponseObject)
    } catch {
      responseError = true
    }
    expect(responseError).toBe(true)
  })

  test('Request times out', async () => {
    // recvRequest timeout
    setTimeout(async () => {
      await aliceAgent.modules.drpc.sendRequest(aliceConnection.id, { jsonrpc: '2.0', method: 'hello', id: 1 })
    }, 500)
    const req = await faberAgent.modules.drpc.recvRequest(100)
    expect(req).toBe(undefined)

    // response listener timeout
    const responseListener = await aliceAgent.modules.drpc.sendRequest(aliceConnection.id, {
      jsonrpc: '2.0',
      method: 'hello',
      id: 1,
    })
    const { request, sendResponse } = await faberAgent.modules.drpc.recvRequest()
    setTimeout(async () => {
      const result = await handleMessageOrError(messageHandlers, request)
      sendResponse(result as DidCommDrpcResponseObject)
    }, 500)

    const helloRecord = await responseListener(100)
    expect(helloRecord).toBe(undefined)

    await new Promise((r) => setTimeout(r, 1500))
  })
})
