import type { AgentContext } from '@credo-ts/core'
import type { DidCommConnectionService, DidCommMessageSender } from '@credo-ts/didcomm'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DidCommDrpcApi } from '../DidCommDrpcApi'
import { DidCommDrpcRole } from '../models'
import type { DidCommDrpcRecord } from '../repository/DidCommDrpcRecord'
import type { DidCommDrpcService } from '../services'

type Listener = (event: { drpcMessageRecord: DidCommDrpcRecord; removeListener: () => void }) => void

describe('DidCommDrpcApi', () => {
  let requestListener: Listener | undefined
  let responseListener: Listener | undefined
  let cancelRequestListener: ReturnType<typeof vi.fn>
  let cancelResponseListener: ReturnType<typeof vi.fn>
  let api: DidCommDrpcApi

  beforeEach(() => {
    vi.useFakeTimers()
    cancelRequestListener = vi.fn()
    cancelResponseListener = vi.fn()
    const drpcMessageService = {
      createRequestListener: (listener: Listener) => {
        requestListener = listener
        return cancelRequestListener
      },
      createResponseListener: (listener: Listener) => {
        responseListener = listener
        return cancelResponseListener
      },
      createRequestMessage: vi.fn().mockResolvedValue({
        requestMessage: { id: 'request-id' },
        record: {},
      }),
    } as unknown as DidCommDrpcService
    const connectionService = {
      getById: vi.fn().mockResolvedValue({ id: 'connection-id' }),
    } as unknown as DidCommConnectionService
    const messageSender = { sendMessage: vi.fn() } as unknown as DidCommMessageSender

    api = new DidCommDrpcApi(drpcMessageService, messageSender, connectionService, {} as AgentContext)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('clears the timeout when a request is received', async () => {
    const received = api.recvRequest(60_000)
    expect(vi.getTimerCount()).toBe(1)
    requestListener?.({
      drpcMessageRecord: {
        request: { jsonrpc: '2.0', method: 'hello', id: 1 },
        role: DidCommDrpcRole.Server,
        connectionId: 'connection-id',
        threadId: 'thread-id',
      } as DidCommDrpcRecord,
      removeListener: vi.fn(),
    })

    await expect(received).resolves.toMatchObject({ request: { method: 'hello' } })
    expect(vi.getTimerCount()).toBe(0)
  })

  it('clears the timeout when a response is received', async () => {
    const waitForResponse = await api.sendRequest('connection-id', { jsonrpc: '2.0', method: 'hello', id: 1 })
    const received = waitForResponse(60_000)
    expect(vi.getTimerCount()).toBe(1)
    responseListener?.({
      drpcMessageRecord: {
        response: { jsonrpc: '2.0', result: 'world', id: 1 },
        threadId: 'request-id',
      } as DidCommDrpcRecord,
      removeListener: vi.fn(),
    })

    await expect(received).resolves.toMatchObject({ result: 'world' })
    expect(vi.getTimerCount()).toBe(0)
  })

  it('resolves with undefined when no request arrives before the timeout', async () => {
    const received = api.recvRequest(1000)
    await vi.advanceTimersByTimeAsync(1000)

    await expect(received).resolves.toBeUndefined()
    expect(cancelRequestListener).toHaveBeenCalled()
  })

  it('resolves with undefined when no response arrives before the timeout', async () => {
    const waitForResponse = await api.sendRequest('connection-id', { jsonrpc: '2.0', method: 'hello', id: 1 })
    const received = waitForResponse(1000)
    await vi.advanceTimersByTimeAsync(1000)

    await expect(received).resolves.toBeUndefined()
    expect(cancelResponseListener).toHaveBeenCalled()
  })

  it('does not set a timeout when none is given', async () => {
    api.recvRequest()
    const waitForResponse = await api.sendRequest('connection-id', { jsonrpc: '2.0', method: 'hello', id: 1 })
    waitForResponse()

    expect(vi.getTimerCount()).toBe(0)
  })
})
