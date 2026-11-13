import type { AgentContext, Logger, Query, QueryOptions } from '@credo-ts/core'
import { AgentConfig, CredoError, EventEmitter, injectable } from '@credo-ts/core'
import type { DidCommInboundMessageContext } from '@credo-ts/didcomm'
import type { DidCommActionMenuStateChangedEvent } from '../DidCommActionMenuEvents'
import { DidCommActionMenuEventTypes } from '../DidCommActionMenuEvents'
import { DidCommActionMenuModuleConfig } from '../DidCommActionMenuModuleConfig'
import { DidCommActionMenuRole } from '../DidCommActionMenuRole'
import { DidCommActionMenuState } from '../DidCommActionMenuState'
import { DidCommActionMenuProblemReportError } from '../errors/DidCommActionMenuProblemReportError'
import { DidCommActionMenuProblemReportReason } from '../errors/DidCommActionMenuProblemReportReason'
import type { DidCommActionMenuProblemReportMessage } from '../messages'
import { DidCommMenuMessage, DidCommMenuRequestMessage, DidCommPerformMessage } from '../messages'
import { DidCommActionMenu, DidCommActionMenuSelection } from '../models'
import { DidCommActionMenuRecord, DidCommActionMenuRepository } from '../repository'
import type {
  ClearMenuOptions,
  CreateMenuOptions,
  CreatePerformOptions,
  CreateRequestOptions,
  FindMenuOptions,
} from './DidCommActionMenuServiceOptions'

/**
 * @internal
 */
@injectable()
export class DidCommActionMenuService {
  private actionMenuRepository: DidCommActionMenuRepository
  private eventEmitter: EventEmitter
  private logger: Logger
  private config: DidCommActionMenuModuleConfig

  public constructor(
    actionMenuRepository: DidCommActionMenuRepository,
    agentConfig: AgentConfig,
    eventEmitter: EventEmitter,
    config: DidCommActionMenuModuleConfig
  ) {
    this.actionMenuRepository = actionMenuRepository
    this.eventEmitter = eventEmitter
    this.logger = agentConfig.logger
    this.config = config
  }

  public async createRequest(agentContext: AgentContext, options: CreateRequestOptions) {
    // Assert
    options.connection.assertReady()

    // Create message
    const menuRequestMessage = new DidCommMenuRequestMessage({})

    // Create record if not existent for connection/role
    let actionMenuRecord = await this.find(agentContext, {
      connectionId: options.connection.id,
      role: DidCommActionMenuRole.Requester,
    })

    if (actionMenuRecord) {
      // Protocol will be restarted and menu cleared
      const previousState = actionMenuRecord.state
      actionMenuRecord.state = DidCommActionMenuState.AwaitingRootMenu
      actionMenuRecord.threadId = menuRequestMessage.id
      actionMenuRecord.menu = undefined
      actionMenuRecord.performedAction = undefined

      await this.actionMenuRepository.update(agentContext, actionMenuRecord)
      this.emitStateChangedEvent(agentContext, actionMenuRecord, previousState)
    } else {
      actionMenuRecord = new DidCommActionMenuRecord({
        connectionId: options.connection.id,
        role: DidCommActionMenuRole.Requester,
        state: DidCommActionMenuState.AwaitingRootMenu,
        threadId: menuRequestMessage.threadId,
      })

      await this.actionMenuRepository.save(agentContext, actionMenuRecord)
      this.emitStateChangedEvent(agentContext, actionMenuRecord, null)
    }

    return { message: menuRequestMessage, record: actionMenuRecord }
  }

  public async processRequest(messageContext: DidCommInboundMessageContext<DidCommMenuRequestMessage>) {
    const { message: menuRequestMessage, agentContext } = messageContext

    this.logger.debug(`Processing menu request with id ${menuRequestMessage.id}`)

    // Assert
    const connection = messageContext.assertReadyConnection()

    let actionMenuRecord = await this.find(agentContext, {
      connectionId: connection.id,
      role: DidCommActionMenuRole.Responder,
    })

    if (actionMenuRecord) {
      // Protocol will be restarted and menu cleared
      const previousState = actionMenuRecord.state
      actionMenuRecord.state = DidCommActionMenuState.PreparingRootMenu
      actionMenuRecord.threadId = menuRequestMessage.id
      actionMenuRecord.menu = undefined
      actionMenuRecord.performedAction = undefined

      await this.actionMenuRepository.update(agentContext, actionMenuRecord)
      this.emitStateChangedEvent(agentContext, actionMenuRecord, previousState)
    } else {
      // Create record
      actionMenuRecord = new DidCommActionMenuRecord({
        connectionId: connection.id,
        role: DidCommActionMenuRole.Responder,
        state: DidCommActionMenuState.PreparingRootMenu,
        threadId: menuRequestMessage.threadId,
      })

      await this.actionMenuRepository.save(agentContext, actionMenuRecord)
      this.emitStateChangedEvent(agentContext, actionMenuRecord, null)
    }

    return actionMenuRecord
  }

  public async createMenu(agentContext: AgentContext, options: CreateMenuOptions) {
    // Assert connection ready
    options.connection.assertReady()

    const uniqueNames = new Set(options.menu.options.map((v) => v.name))
    if (uniqueNames.size < options.menu.options.length) {
      throw new CredoError('Action Menu contains duplicated options')
    }

    // Create message
    const menuMessage = new DidCommMenuMessage({
      title: options.menu.title,
      description: options.menu.description,
      options: options.menu.options,
    })

    // Check if there is an existing menu for this connection and role
    let actionMenuRecord = await this.find(agentContext, {
      connectionId: options.connection.id,
      role: DidCommActionMenuRole.Responder,
    })

    // If so, continue existing flow
    if (actionMenuRecord) {
      if (this.config.strictStateChecking) {
        actionMenuRecord.assertState([
          DidCommActionMenuState.Null,
          DidCommActionMenuState.PreparingRootMenu,
          DidCommActionMenuState.Done,
        ])
      }

      // The new menu will be bound to the existing thread
      // unless it is in null state (protocol reset)
      if (actionMenuRecord.state !== DidCommActionMenuState.Null) {
        menuMessage.setThread({ threadId: actionMenuRecord.threadId })
      }

      const previousState = actionMenuRecord.state
      actionMenuRecord.menu = options.menu
      actionMenuRecord.state = DidCommActionMenuState.AwaitingSelection
      actionMenuRecord.threadId = menuMessage.threadId

      await this.actionMenuRepository.update(agentContext, actionMenuRecord)
      this.emitStateChangedEvent(agentContext, actionMenuRecord, previousState)
    } else {
      // Create record
      actionMenuRecord = new DidCommActionMenuRecord({
        connectionId: options.connection.id,
        role: DidCommActionMenuRole.Responder,
        state: DidCommActionMenuState.AwaitingSelection,
        menu: options.menu,
        threadId: menuMessage.threadId,
      })

      await this.actionMenuRepository.save(agentContext, actionMenuRecord)
      this.emitStateChangedEvent(agentContext, actionMenuRecord, null)
    }

    return { message: menuMessage, record: actionMenuRecord }
  }

  public async processMenu(messageContext: DidCommInboundMessageContext<DidCommMenuMessage>) {
    const { message: menuMessage, agentContext } = messageContext

    this.logger.debug(`Processing action menu with id ${menuMessage.id}`)

    // Assert
    const connection = messageContext.assertReadyConnection()

    // Check if there is an existing menu for this connection and role
    const record = await this.find(agentContext, {
      connectionId: connection.id,
      role: DidCommActionMenuRole.Requester,
    })

    if (record) {
      // Record found: update with menu details
      const previousState = record.state

      record.state = DidCommActionMenuState.PreparingSelection
      record.menu = new DidCommActionMenu({
        title: menuMessage.title,
        description: menuMessage.description,
        options: menuMessage.options,
      })
      record.threadId = menuMessage.threadId
      record.performedAction = undefined

      await this.actionMenuRepository.update(agentContext, record)

      this.emitStateChangedEvent(agentContext, record, previousState)
    } else {
      // Record not found: create it
      const actionMenuRecord = new DidCommActionMenuRecord({
        connectionId: connection.id,
        role: DidCommActionMenuRole.Requester,
        state: DidCommActionMenuState.PreparingSelection,
        threadId: menuMessage.threadId,
        menu: new DidCommActionMenu({
          title: menuMessage.title,
          description: menuMessage.description,
          options: menuMessage.options,
        }),
      })

      await this.actionMenuRepository.save(agentContext, actionMenuRecord)

      this.emitStateChangedEvent(agentContext, actionMenuRecord, null)
    }
  }

  public async createPerform(agentContext: AgentContext, options: CreatePerformOptions) {
    const { actionMenuRecord: record, performedAction: performedSelection } = options

    // Assert
    record.assertRole(DidCommActionMenuRole.Requester)
    if (this.config.strictStateChecking) {
      record.assertState([DidCommActionMenuState.PreparingSelection])
    }

    const validSelection = record.menu?.options.some((item) => item.name === performedSelection.name)
    if (!validSelection) {
      throw new CredoError('Selection does not match valid actions')
    }

    const previousState = record.state

    // Create message
    const menuMessage = new DidCommPerformMessage({
      name: performedSelection.name,
      params: performedSelection.params,
      threadId: record.threadId,
    })

    // Update record
    record.performedAction = options.performedAction
    record.state = DidCommActionMenuState.Done

    await this.actionMenuRepository.update(agentContext, record)

    this.emitStateChangedEvent(agentContext, record, previousState)

    return { message: menuMessage, record }
  }

  public async processPerform(messageContext: DidCommInboundMessageContext<DidCommPerformMessage>) {
    const { message: performMessage, agentContext } = messageContext

    this.logger.debug(`Processing action menu perform with id ${performMessage.id}`)

    const connection = messageContext.assertReadyConnection()

    // Check if there is an existing menu for this connection and role
    const record = await this.find(agentContext, {
      connectionId: connection.id,
      role: DidCommActionMenuRole.Responder,
      threadId: performMessage.threadId,
    })

    if (record) {
      // Record found: check state and update with menu details

      // A Null state means that menu has been cleared by the responder.
      // Requester should be informed in order to request another menu
      if (record.state === DidCommActionMenuState.Null) {
        throw new DidCommActionMenuProblemReportError('Action Menu has been cleared by the responder', {
          problemCode: DidCommActionMenuProblemReportReason.Timeout,
        })
      }
      if (this.config.strictStateChecking) {
        record.assertState([DidCommActionMenuState.AwaitingSelection])
      }

      const validSelection = record.menu?.options.some((item) => item.name === performMessage.name)
      if (!validSelection) {
        throw new CredoError('Selection does not match valid actions')
      }

      const previousState = record.state

      record.state = DidCommActionMenuState.Done
      record.performedAction = new DidCommActionMenuSelection({
        name: performMessage.name,
        params: performMessage.params,
      })

      await this.actionMenuRepository.update(agentContext, record)

      this.emitStateChangedEvent(agentContext, record, previousState)
    } else {
      throw new CredoError(`No Action Menu found with thread id ${messageContext.message.threadId}`)
    }
  }

  public async clearMenu(agentContext: AgentContext, options: ClearMenuOptions) {
    const { actionMenuRecord: record } = options

    const previousState = record.state

    // Update record
    record.state = DidCommActionMenuState.Null
    record.menu = undefined
    record.performedAction = undefined

    await this.actionMenuRepository.update(agentContext, record)

    this.emitStateChangedEvent(agentContext, record, previousState)

    return record
  }

  public async processProblemReport(
    messageContext: DidCommInboundMessageContext<DidCommActionMenuProblemReportMessage>
  ): Promise<DidCommActionMenuRecord> {
    const { message: actionMenuProblemReportMessage, agentContext } = messageContext

    const connection = messageContext.assertReadyConnection()

    this.logger.debug(`Processing problem report with id ${actionMenuProblemReportMessage.id}`)

    const actionMenuRecord = await this.find(agentContext, {
      role: DidCommActionMenuRole.Requester,
      connectionId: connection.id,
    })

    if (!actionMenuRecord) {
      throw new CredoError(`Unable to process action menu problem: record not found for connection id ${connection.id}`)
    }
    // Clear menu to restart flow
    return await this.clearMenu(agentContext, { actionMenuRecord })
  }

  public async findById(agentContext: AgentContext, actionMenuRecordId: string) {
    return await this.actionMenuRepository.findById(agentContext, actionMenuRecordId)
  }

  public async find(agentContext: AgentContext, options: FindMenuOptions) {
    return await this.actionMenuRepository.findSingleByQuery(agentContext, {
      connectionId: options.connectionId,
      role: options.role,
      threadId: options.threadId,
    })
  }

  public async findAllByQuery(
    agentContext: AgentContext,
    options: Query<DidCommActionMenuRecord>,
    queryOptions?: QueryOptions
  ) {
    return await this.actionMenuRepository.findByQuery(agentContext, options, queryOptions)
  }

  private emitStateChangedEvent(
    agentContext: AgentContext,
    actionMenuRecord: DidCommActionMenuRecord,
    previousState: DidCommActionMenuState | null
  ) {
    this.eventEmitter.emit<DidCommActionMenuStateChangedEvent>(agentContext, {
      type: DidCommActionMenuEventTypes.DidCommActionMenuStateChanged,
      payload: {
        actionMenuRecord: actionMenuRecord.clone(),
        previousState: previousState,
      },
    })
  }
}
