import type { EventEmitter } from '@credo-ts/core'
import { DidCommDidExchangeState, DidCommInboundMessageContext } from '@credo-ts/didcomm'
import { getAgentContext, getMockConnection } from '../../../../tests/helpers'
import type { MockedClassConstructor } from '../../../../tests/types'
import type { DidCommDrpcRequestObject } from '../messages'
import { DidCommDrpcRequestMessage } from '../messages'
import { DidCommDrpcRole } from '../models/DidCommDrpcRole'
import { DidCommDrpcRecord } from '../repository/DidCommDrpcRecord'
import { DidCommDrpcRepository } from '../repository/DidCommDrpcRepository'
import { DidCommDrpcService } from '../services'

vi.mock('../repository/DidCommDrpcRepository')
const DrpcRepositoryMock = DidCommDrpcRepository as MockedClassConstructor<typeof DidCommDrpcRepository>
const drpcMessageRepository = new DrpcRepositoryMock()

const eventEmitter = { emit: vi.fn(), on: vi.fn(), off: vi.fn() } as unknown as EventEmitter

const agentContext = getAgentContext()

describe('DidCommDrpcService', () => {
  let drpcMessageService: DidCommDrpcService
  const mockConnectionRecord = getMockConnection({
    id: 'd3849ac3-c981-455b-a1aa-a10bea6cead8',
    did: 'did:sov:C2SsBf5QUQpqSAQfhu3sd2',
    state: DidCommDidExchangeState.Completed,
  })

  beforeEach(() => {
    drpcMessageService = new DidCommDrpcService(drpcMessageRepository, eventEmitter)
  })

  describe('createMessage', () => {
    it('creates message and record, and emits message and basic message record', async () => {
      const messageRequest: DidCommDrpcRequestObject = {
        jsonrpc: '2.0',
        method: 'hello',
        id: 1,
      }
      const { requestMessage } = await drpcMessageService.createRequestMessage(
        agentContext,
        messageRequest,
        mockConnectionRecord.id
      )

      expect(requestMessage).toBeInstanceOf(DidCommDrpcRequestMessage)
      expect((requestMessage.request as DidCommDrpcRequestObject).method).toBe('hello')

      expect(drpcMessageRepository.save).toHaveBeenCalledWith(agentContext, expect.any(DidCommDrpcRecord))
      expect(eventEmitter.emit).toHaveBeenCalledWith(agentContext, {
        type: 'DidCommDrpcRequestStateChanged',
        payload: {
          drpcMessageRecord: expect.objectContaining({
            connectionId: mockConnectionRecord.id,
            request: {
              id: 1,
              jsonrpc: '2.0',
              method: 'hello',
            },
            role: DidCommDrpcRole.Client,
          }),
        },
      })
    })
  })

  describe('recieve request', () => {
    it('stores record and emits message and basic message record', async () => {
      const drpcMessage = new DidCommDrpcRequestMessage({ request: { jsonrpc: '2.0', method: 'hello', id: 1 } })

      const messageContext = new DidCommInboundMessageContext(drpcMessage, {
        agentContext,
        connection: mockConnectionRecord,
      })

      await drpcMessageService.receiveRequest(messageContext)

      expect(drpcMessageRepository.save).toHaveBeenCalledWith(agentContext, expect.any(DidCommDrpcRecord))
      expect(eventEmitter.emit).toHaveBeenCalledWith(agentContext, {
        type: 'DidCommDrpcRequestStateChanged',
        payload: {
          drpcMessageRecord: expect.objectContaining({
            connectionId: mockConnectionRecord.id,
            request: {
              id: 1,
              jsonrpc: '2.0',
              method: 'hello',
            },
            role: DidCommDrpcRole.Server,
          }),
        },
      })
    })
  })
})
