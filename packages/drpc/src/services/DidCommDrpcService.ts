import type { AgentContext, Query, QueryOptions } from '@credo-ts/core'
import { EventEmitter, injectable } from '@credo-ts/core'
import type { DidCommInboundMessageContext } from '@credo-ts/didcomm'
import type { DidCommDrpcRequestStateChangedEvent } from '../DidCommDrpcRequestEvents'
import { DidCommDrpcRequestEventTypes } from '../DidCommDrpcRequestEvents'
import type { DidCommDrpcResponseStateChangedEvent } from '../DidCommDrpcResponseEvents'
import { DidCommDrpcResponseEventTypes } from '../DidCommDrpcResponseEvents'
import type { DidCommDrpcRequest, DidCommDrpcResponse } from '../messages'
import { DidCommDrpcRequestMessage, DidCommDrpcResponseMessage } from '../messages'
import { DidCommDrpcRole, DidCommDrpcState, isValidDrpcRequest, isValidDrpcResponse } from '../models'
import { DidCommDrpcRecord, DidCommDrpcRepository } from '../repository'

@injectable()
export class DidCommDrpcService {
  private drpcMessageRepository: DidCommDrpcRepository
  private eventEmitter: EventEmitter

  public constructor(drpcMessageRepository: DidCommDrpcRepository, eventEmitter: EventEmitter) {
    this.drpcMessageRepository = drpcMessageRepository
    this.eventEmitter = eventEmitter
  }

  public async createRequestMessage(agentContext: AgentContext, request: DidCommDrpcRequest, connectionId: string) {
    const drpcMessage = new DidCommDrpcRequestMessage({ request })

    const drpcMessageRecord = new DidCommDrpcRecord({
      request,
      connectionId,
      state: DidCommDrpcState.RequestSent,
      threadId: drpcMessage.threadId,
      role: DidCommDrpcRole.Client,
    })

    await this.drpcMessageRepository.save(agentContext, drpcMessageRecord)
    this.emitStateChangedEvent(agentContext, drpcMessageRecord)

    return { requestMessage: drpcMessage, record: drpcMessageRecord }
  }

  public async createResponseMessage(
    agentContext: AgentContext,
    response: DidCommDrpcResponse,
    drpcRecord: DidCommDrpcRecord
  ) {
    const drpcMessage = new DidCommDrpcResponseMessage({ response, threadId: drpcRecord.threadId })

    drpcRecord.assertState(DidCommDrpcState.RequestReceived)

    drpcRecord.response = response
    drpcRecord.request = undefined

    await this.updateState(agentContext, drpcRecord, DidCommDrpcState.Completed)

    return { responseMessage: drpcMessage, record: drpcRecord }
  }

  public createRequestListener(
    callback: (params: { drpcMessageRecord: DidCommDrpcRecord; removeListener: () => void }) => void | Promise<void>
  ) {
    const listener = async (event: DidCommDrpcRequestStateChangedEvent) => {
      const { drpcMessageRecord } = event.payload
      await callback({
        drpcMessageRecord,
        removeListener: () =>
          this.eventEmitter.off(DidCommDrpcRequestEventTypes.DidCommDrpcRequestStateChanged, listener),
      })
    }
    this.eventEmitter.on(DidCommDrpcRequestEventTypes.DidCommDrpcRequestStateChanged, listener)

    return () => {
      this.eventEmitter.off(DidCommDrpcRequestEventTypes.DidCommDrpcRequestStateChanged, listener)
    }
  }

  public createResponseListener(
    callback: (params: { drpcMessageRecord: DidCommDrpcRecord; removeListener: () => void }) => void | Promise<void>
  ) {
    const listener = async (event: DidCommDrpcResponseStateChangedEvent) => {
      const { drpcMessageRecord } = event.payload
      await callback({
        drpcMessageRecord,
        removeListener: () =>
          this.eventEmitter.off(DidCommDrpcResponseEventTypes.DidCommDrpcResponseStateChanged, listener),
      })
    }
    this.eventEmitter.on(DidCommDrpcResponseEventTypes.DidCommDrpcResponseStateChanged, listener)
    return () => {
      this.eventEmitter.off(DidCommDrpcResponseEventTypes.DidCommDrpcResponseStateChanged, listener)
    }
  }

  public async receiveResponse(messageContext: DidCommInboundMessageContext<DidCommDrpcResponseMessage>) {
    const connection = messageContext.assertReadyConnection()
    const drpcMessageRecord = await this.findByThreadAndConnectionId(
      messageContext.agentContext,
      connection.id,
      messageContext.message.threadId
    )

    if (!drpcMessageRecord) {
      throw new Error('DRPC message record not found')
    }

    drpcMessageRecord.assertRole(DidCommDrpcRole.Client)
    drpcMessageRecord.assertState(DidCommDrpcState.RequestSent)
    drpcMessageRecord.response = messageContext.message.response
    drpcMessageRecord.request = undefined

    await this.updateState(messageContext.agentContext, drpcMessageRecord, DidCommDrpcState.Completed)
    return drpcMessageRecord
  }

  public async receiveRequest(messageContext: DidCommInboundMessageContext<DidCommDrpcRequestMessage>) {
    const connection = messageContext.assertReadyConnection()
    const record = await this.findByThreadAndConnectionId(
      messageContext.agentContext,
      connection.id,
      messageContext.message.threadId
    )

    if (record) {
      throw new Error('DRPC message record already exists')
    }
    const drpcMessageRecord = new DidCommDrpcRecord({
      request: messageContext.message.request,
      connectionId: connection.id,
      role: DidCommDrpcRole.Server,
      state: DidCommDrpcState.RequestReceived,
      threadId: messageContext.message.id,
    })

    await this.drpcMessageRepository.save(messageContext.agentContext, drpcMessageRecord)
    this.emitStateChangedEvent(messageContext.agentContext, drpcMessageRecord)
    return drpcMessageRecord
  }

  private emitStateChangedEvent(agentContext: AgentContext, drpcMessageRecord: DidCommDrpcRecord) {
    if (
      drpcMessageRecord.request &&
      (isValidDrpcRequest(drpcMessageRecord.request) ||
        (Array.isArray(drpcMessageRecord.request) &&
          drpcMessageRecord.request.length > 0 &&
          isValidDrpcRequest(drpcMessageRecord.request[0])))
    ) {
      this.eventEmitter.emit<DidCommDrpcRequestStateChangedEvent>(agentContext, {
        type: DidCommDrpcRequestEventTypes.DidCommDrpcRequestStateChanged,
        payload: { drpcMessageRecord: drpcMessageRecord.clone() },
      })
    } else if (
      drpcMessageRecord.response &&
      (isValidDrpcResponse(drpcMessageRecord.response) ||
        (Array.isArray(drpcMessageRecord.response) &&
          drpcMessageRecord.response.length > 0 &&
          isValidDrpcResponse(drpcMessageRecord.response[0])))
    ) {
      this.eventEmitter.emit<DidCommDrpcResponseStateChangedEvent>(agentContext, {
        type: DidCommDrpcResponseEventTypes.DidCommDrpcResponseStateChanged,
        payload: { drpcMessageRecord: drpcMessageRecord.clone() },
      })
    }
  }

  private async updateState(agentContext: AgentContext, drpcRecord: DidCommDrpcRecord, newState: DidCommDrpcState) {
    drpcRecord.state = newState
    await this.drpcMessageRepository.update(agentContext, drpcRecord)

    this.emitStateChangedEvent(agentContext, drpcRecord)
  }

  public findByThreadAndConnectionId(
    agentContext: AgentContext,
    connectionId: string,
    threadId: string
  ): Promise<DidCommDrpcRecord | null> {
    return this.drpcMessageRepository.findSingleByQuery(agentContext, {
      connectionId,
      threadId,
    })
  }

  public async findAllByQuery(
    agentContext: AgentContext,
    query: Query<DidCommDrpcRecord>,
    queryOptions?: QueryOptions
  ) {
    return this.drpcMessageRepository.findByQuery(agentContext, query, queryOptions)
  }

  public async getById(agentContext: AgentContext, drpcMessageRecordId: string) {
    return this.drpcMessageRepository.getById(agentContext, drpcMessageRecordId)
  }

  public async deleteById(agentContext: AgentContext, drpcMessageRecordId: string) {
    const drpcMessageRecord = await this.getById(agentContext, drpcMessageRecordId)
    return this.drpcMessageRepository.delete(agentContext, drpcMessageRecord)
  }
}
