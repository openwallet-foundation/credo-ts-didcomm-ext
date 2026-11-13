import type { AgentConfig, AgentContext, Repository } from '@credo-ts/core'
import { EventEmitter } from '@credo-ts/core'
import { DidCommDidExchangeState, DidCommInboundMessageContext } from '@credo-ts/didcomm'
import { Subject } from 'rxjs'
import {
  agentDependencies,
  getAgentConfig,
  getAgentContext,
  getMockConnection,
  mockFunction,
} from '../../../../../tests/helpers'
import type { MockedClassConstructor } from '../../../../../tests/types'
import type { DidCommActionMenuStateChangedEvent } from '../../DidCommActionMenuEvents'
import { DidCommActionMenuEventTypes } from '../../DidCommActionMenuEvents'
import { DidCommActionMenuModuleConfig } from '../../DidCommActionMenuModuleConfig'
import { DidCommActionMenuRole } from '../../DidCommActionMenuRole'
import { DidCommActionMenuState } from '../../DidCommActionMenuState'
import { DidCommActionMenuProblemReportError } from '../../errors/DidCommActionMenuProblemReportError'
import { DidCommMenuMessage, DidCommMenuRequestMessage, DidCommPerformMessage } from '../../messages'
import type { DidCommActionMenuSelection } from '../../models'
import { DidCommActionMenu } from '../../models'
import { DidCommActionMenuRecord, DidCommActionMenuRepository } from '../../repository'
import { DidCommActionMenuService } from '../DidCommActionMenuService'

vi.mock('../../repository/DidCommActionMenuRepository')
const ActionMenuRepositoryMock = DidCommActionMenuRepository as MockedClassConstructor<
  typeof DidCommActionMenuRepository
>

describe('DidCommActionMenuService', () => {
  const mockConnectionRecord = getMockConnection({
    id: 'd3849ac3-c981-455b-a1aa-a10bea6cead8',
    did: 'did:sov:C2SsBf5QUQpqSAQfhu3sd2',
    state: DidCommDidExchangeState.Completed,
  })

  let actionMenuRepository: Repository<DidCommActionMenuRecord>
  let actionMenuService: DidCommActionMenuService
  let eventEmitter: EventEmitter
  let agentConfig: AgentConfig
  let agentContext: AgentContext

  const mockActionMenuRecord = (options: {
    connectionId: string
    role: DidCommActionMenuRole
    state: DidCommActionMenuState
    threadId: string
    menu?: DidCommActionMenu
    performedAction?: DidCommActionMenuSelection
  }) => {
    return new DidCommActionMenuRecord({
      connectionId: options.connectionId,
      role: options.role,
      state: options.state,
      threadId: options.threadId,
      menu: options.menu,
      performedAction: options.performedAction,
    })
  }

  beforeAll(async () => {
    agentConfig = getAgentConfig('ActionMenuServiceTest')
    agentContext = getAgentContext()
  })

  beforeEach(async () => {
    actionMenuRepository = new ActionMenuRepositoryMock()
    eventEmitter = new EventEmitter(agentDependencies, new Subject())
    actionMenuService = new DidCommActionMenuService(
      actionMenuRepository,
      agentConfig,
      eventEmitter,
      new DidCommActionMenuModuleConfig({})
    )
  })

  afterEach(() => {
    vitest.clearAllMocks()
  })

  describe('createMenu', () => {
    let testMenu: DidCommActionMenu

    beforeAll(() => {
      testMenu = new DidCommActionMenu({
        description: 'menu-description',
        title: 'menu-title',
        options: [{ name: 'opt1', title: 'opt1-title', description: 'opt1-desc' }],
      })
    })

    it('throws an error when duplicated options are specified', async () => {
      await expect(
        actionMenuService.createMenu(agentContext, {
          connection: mockConnectionRecord,
          menu: {
            title: 'menu-title',
            description: 'menu-description',
            options: [
              { name: 'opt1', description: 'desc1', title: 'title1' },
              { name: 'opt2', description: 'desc2', title: 'title2' },
              { name: 'opt1', description: 'desc3', title: 'title3' },
              { name: 'opt4', description: 'desc4', title: 'title4' },
            ],
          },
        })
      ).rejects.toThrow('Action Menu contains duplicated options')
    })

    it('no previous menu: emits a menu with title, description and options', async () => {
      // No previous menu
      mockFunction(actionMenuRepository.findSingleByQuery).mockReturnValue(Promise.resolve(null))

      const eventListenerMock = vi.fn()
      eventEmitter.on<DidCommActionMenuStateChangedEvent>(
        DidCommActionMenuEventTypes.DidCommActionMenuStateChanged,
        eventListenerMock
      )

      await actionMenuService.createMenu(agentContext, {
        connection: mockConnectionRecord,
        menu: testMenu,
      })

      expect(eventListenerMock).toHaveBeenCalledWith({
        type: DidCommActionMenuEventTypes.DidCommActionMenuStateChanged,
        metadata: {
          contextCorrelationId: 'mock',
        },
        payload: {
          previousState: null,
          actionMenuRecord: expect.objectContaining({
            connectionId: mockConnectionRecord.id,
            role: DidCommActionMenuRole.Responder,
            state: DidCommActionMenuState.AwaitingSelection,
            menu: expect.objectContaining({
              description: 'menu-description',
              title: 'menu-title',
              options: [{ name: 'opt1', title: 'opt1-title', description: 'opt1-desc' }],
            }),
          }),
        },
      })
    })

    it('existing menu: emits a menu with title, description, options and thread', async () => {
      // Previous menu is in Done state
      const previousMenuDone = mockActionMenuRecord({
        connectionId: mockConnectionRecord.id,
        role: DidCommActionMenuRole.Responder,
        state: DidCommActionMenuState.Done,
        threadId: 'threadId-1',
      })

      mockFunction(actionMenuRepository.findSingleByQuery).mockReturnValue(Promise.resolve(previousMenuDone))

      const eventListenerMock = vi.fn()
      eventEmitter.on<DidCommActionMenuStateChangedEvent>(
        DidCommActionMenuEventTypes.DidCommActionMenuStateChanged,
        eventListenerMock
      )

      await actionMenuService.createMenu(agentContext, {
        connection: mockConnectionRecord,
        menu: testMenu,
      })

      expect(eventListenerMock).toHaveBeenCalledWith({
        type: DidCommActionMenuEventTypes.DidCommActionMenuStateChanged,
        metadata: {
          contextCorrelationId: 'mock',
        },
        payload: {
          previousState: DidCommActionMenuState.Done,
          actionMenuRecord: expect.objectContaining({
            connectionId: mockConnectionRecord.id,
            threadId: 'threadId-1',
            role: DidCommActionMenuRole.Responder,
            state: DidCommActionMenuState.AwaitingSelection,
            menu: expect.objectContaining({
              description: 'menu-description',
              title: 'menu-title',
              options: [{ name: 'opt1', title: 'opt1-title', description: 'opt1-desc' }],
            }),
          }),
        },
      })
    })

    it('existing menu, cleared: emits a menu with title, description, options and new thread', async () => {
      // Previous menu is in Done state
      const previousMenuClear = mockActionMenuRecord({
        connectionId: mockConnectionRecord.id,
        role: DidCommActionMenuRole.Responder,
        state: DidCommActionMenuState.Null,
        threadId: 'threadId-1',
      })

      mockFunction(actionMenuRepository.findSingleByQuery).mockReturnValue(Promise.resolve(previousMenuClear))

      const eventListenerMock = vi.fn()
      eventEmitter.on<DidCommActionMenuStateChangedEvent>(
        DidCommActionMenuEventTypes.DidCommActionMenuStateChanged,
        eventListenerMock
      )

      await actionMenuService.createMenu(agentContext, {
        connection: mockConnectionRecord,
        menu: testMenu,
      })

      expect(eventListenerMock).toHaveBeenCalledWith({
        type: DidCommActionMenuEventTypes.DidCommActionMenuStateChanged,
        metadata: {
          contextCorrelationId: 'mock',
        },
        payload: {
          previousState: DidCommActionMenuState.Null,
          actionMenuRecord: expect.objectContaining({
            connectionId: mockConnectionRecord.id,
            threadId: expect.not.stringMatching('threadId-1'),
            role: DidCommActionMenuRole.Responder,
            state: DidCommActionMenuState.AwaitingSelection,
            menu: expect.objectContaining({
              description: 'menu-description',
              title: 'menu-title',
              options: [{ name: 'opt1', title: 'opt1-title', description: 'opt1-desc' }],
            }),
          }),
        },
      })
    })
  })

  describe('createPerform', () => {
    let mockRecord: DidCommActionMenuRecord

    beforeEach(() => {
      const testMenu = new DidCommActionMenu({
        description: 'menu-description',
        title: 'menu-title',
        options: [
          { name: 'opt1', title: 'opt1-title', description: 'opt1-desc' },
          { name: 'opt2', title: 'opt2-title', description: 'opt2-desc' },
        ],
      })

      mockRecord = mockActionMenuRecord({
        connectionId: mockConnectionRecord.id,
        role: DidCommActionMenuRole.Requester,
        state: DidCommActionMenuState.PreparingSelection,
        threadId: '123',
        menu: testMenu,
      })
    })

    it('throws an error when invalid selection is provided', async () => {
      await expect(
        actionMenuService.createPerform(agentContext, {
          actionMenuRecord: mockRecord,
          performedAction: { name: 'fake' },
        })
      ).rejects.toThrow('Selection does not match valid actions')
    })

    it('throws an error when state is not preparing-selection', async () => {
      for (const state of Object.values(DidCommActionMenuState).filter(
        (state) => state !== DidCommActionMenuState.PreparingSelection
      )) {
        mockRecord.state = state
        await expect(
          actionMenuService.createPerform(agentContext, {
            actionMenuRecord: mockRecord,
            performedAction: { name: 'opt1' },
          })
        ).rejects.toThrow(`Action Menu record is in invalid state ${state}. Valid states are: preparing-selection.`)
      }
    })

    it('emits a menu with a valid selection and action menu record', async () => {
      const eventListenerMock = vi.fn()
      eventEmitter.on<DidCommActionMenuStateChangedEvent>(
        DidCommActionMenuEventTypes.DidCommActionMenuStateChanged,
        eventListenerMock
      )

      mockFunction(actionMenuRepository.findSingleByQuery).mockReturnValue(Promise.resolve(mockRecord))

      await actionMenuService.createPerform(agentContext, {
        actionMenuRecord: mockRecord,
        performedAction: { name: 'opt2' },
      })

      expect(eventListenerMock).toHaveBeenCalledWith({
        type: DidCommActionMenuEventTypes.DidCommActionMenuStateChanged,
        metadata: {
          contextCorrelationId: 'mock',
        },
        payload: {
          previousState: DidCommActionMenuState.PreparingSelection,
          actionMenuRecord: expect.objectContaining({
            connectionId: mockConnectionRecord.id,
            role: DidCommActionMenuRole.Requester,
            state: DidCommActionMenuState.Done,
            performedAction: { name: 'opt2' },
          }),
        },
      })
    })
  })

  describe('createRequest', () => {
    let mockRecord: DidCommActionMenuRecord

    beforeEach(() => {
      const testMenu = new DidCommActionMenu({
        description: 'menu-description',
        title: 'menu-title',
        options: [
          { name: 'opt1', title: 'opt1-title', description: 'opt1-desc' },
          { name: 'opt2', title: 'opt2-title', description: 'opt2-desc' },
        ],
      })

      mockRecord = mockActionMenuRecord({
        connectionId: mockConnectionRecord.id,
        role: DidCommActionMenuRole.Requester,
        state: DidCommActionMenuState.PreparingSelection,
        threadId: '123',
        menu: testMenu,
      })
    })

    it('no existing record: emits event and creates new request and record', async () => {
      mockFunction(actionMenuRepository.findSingleByQuery).mockReturnValue(Promise.resolve(null))

      const eventListenerMock = vi.fn()
      eventEmitter.on<DidCommActionMenuStateChangedEvent>(
        DidCommActionMenuEventTypes.DidCommActionMenuStateChanged,
        eventListenerMock
      )

      const { message, record } = await actionMenuService.createRequest(agentContext, {
        connection: mockConnectionRecord,
      })

      const expectedRecord = {
        id: expect.any(String),
        connectionId: mockConnectionRecord.id,
        role: DidCommActionMenuRole.Requester,
        threadId: message.threadId,
        state: DidCommActionMenuState.AwaitingRootMenu,
        menu: undefined,
        performedAction: undefined,
      }
      expect(record).toMatchObject(expectedRecord)

      expect(actionMenuRepository.save).toHaveBeenCalledWith(agentContext, expect.objectContaining(expectedRecord))
      expect(actionMenuRepository.update).not.toHaveBeenCalled()

      expect(eventListenerMock).toHaveBeenCalledWith({
        type: DidCommActionMenuEventTypes.DidCommActionMenuStateChanged,
        metadata: {
          contextCorrelationId: 'mock',
        },
        payload: {
          previousState: null,
          actionMenuRecord: expect.objectContaining(expectedRecord),
        },
      })
    })

    it('already existing record: emits event, creates new request and updates record', async () => {
      mockFunction(actionMenuRepository.findSingleByQuery).mockReturnValue(Promise.resolve(mockRecord))

      const previousState = mockRecord.state

      const eventListenerMock = vi.fn()
      eventEmitter.on<DidCommActionMenuStateChangedEvent>(
        DidCommActionMenuEventTypes.DidCommActionMenuStateChanged,
        eventListenerMock
      )

      const { message, record } = await actionMenuService.createRequest(agentContext, {
        connection: mockConnectionRecord,
      })

      const expectedRecord = {
        id: expect.any(String),
        connectionId: mockConnectionRecord.id,
        role: DidCommActionMenuRole.Requester,
        threadId: message.threadId,
        state: DidCommActionMenuState.AwaitingRootMenu,
        menu: undefined,
        performedAction: undefined,
      }
      expect(record).toMatchObject(expectedRecord)

      expect(actionMenuRepository.update).toHaveBeenCalledWith(agentContext, expect.objectContaining(expectedRecord))
      expect(actionMenuRepository.save).not.toHaveBeenCalled()

      expect(eventListenerMock).toHaveBeenCalledWith({
        type: DidCommActionMenuEventTypes.DidCommActionMenuStateChanged,
        metadata: {
          contextCorrelationId: 'mock',
        },
        payload: {
          previousState,
          actionMenuRecord: expect.objectContaining(expectedRecord),
        },
      })
    })
  })

  describe('clearMenu', () => {
    let mockRecord: DidCommActionMenuRecord

    beforeEach(() => {
      const testMenu = new DidCommActionMenu({
        description: 'menu-description',
        title: 'menu-title',
        options: [
          { name: 'opt1', title: 'opt1-title', description: 'opt1-desc' },
          { name: 'opt2', title: 'opt2-title', description: 'opt2-desc' },
        ],
      })

      mockRecord = mockActionMenuRecord({
        connectionId: mockConnectionRecord.id,
        role: DidCommActionMenuRole.Requester,
        state: DidCommActionMenuState.PreparingSelection,
        threadId: '123',
        menu: testMenu,
        performedAction: { name: 'opt1' },
      })
    })

    it('requester role: emits a cleared menu', async () => {
      const eventListenerMock = vi.fn()
      eventEmitter.on<DidCommActionMenuStateChangedEvent>(
        DidCommActionMenuEventTypes.DidCommActionMenuStateChanged,
        eventListenerMock
      )

      mockRecord.role = DidCommActionMenuRole.Requester
      mockFunction(actionMenuRepository.findSingleByQuery).mockReturnValue(Promise.resolve(mockRecord))

      await actionMenuService.clearMenu(agentContext, {
        actionMenuRecord: mockRecord,
      })

      expect(eventListenerMock).toHaveBeenCalledWith({
        type: DidCommActionMenuEventTypes.DidCommActionMenuStateChanged,
        metadata: {
          contextCorrelationId: 'mock',
        },
        payload: {
          previousState: DidCommActionMenuState.PreparingSelection,
          actionMenuRecord: expect.objectContaining({
            connectionId: mockConnectionRecord.id,
            role: DidCommActionMenuRole.Requester,
            state: DidCommActionMenuState.Null,
            menu: undefined,
            performedAction: undefined,
          }),
        },
      })
    })

    it('responder role: emits a cleared menu', async () => {
      const eventListenerMock = vi.fn()
      eventEmitter.on<DidCommActionMenuStateChangedEvent>(
        DidCommActionMenuEventTypes.DidCommActionMenuStateChanged,
        eventListenerMock
      )

      mockRecord.state = DidCommActionMenuState.AwaitingSelection
      mockRecord.role = DidCommActionMenuRole.Responder
      mockFunction(actionMenuRepository.findSingleByQuery).mockReturnValue(Promise.resolve(mockRecord))

      await actionMenuService.clearMenu(agentContext, {
        actionMenuRecord: mockRecord,
      })

      expect(eventListenerMock).toHaveBeenCalledWith({
        type: DidCommActionMenuEventTypes.DidCommActionMenuStateChanged,
        metadata: {
          contextCorrelationId: 'mock',
        },
        payload: {
          previousState: DidCommActionMenuState.AwaitingSelection,
          actionMenuRecord: expect.objectContaining({
            connectionId: mockConnectionRecord.id,
            role: DidCommActionMenuRole.Responder,
            state: DidCommActionMenuState.Null,
            menu: undefined,
            performedAction: undefined,
          }),
        },
      })
    })
  })

  describe('processMenu', () => {
    let mockRecord: DidCommActionMenuRecord
    let mockMenuMessage: DidCommMenuMessage

    beforeEach(() => {
      mockRecord = mockActionMenuRecord({
        connectionId: mockConnectionRecord.id,
        role: DidCommActionMenuRole.Requester,
        state: DidCommActionMenuState.PreparingSelection,
        threadId: '123',
        menu: new DidCommActionMenu({
          description: 'menu-description',
          title: 'menu-title',
          options: [
            { name: 'opt1', title: 'opt1-title', description: 'opt1-desc' },
            { name: 'opt2', title: 'opt2-title', description: 'opt2-desc' },
          ],
        }),
        performedAction: { name: 'opt1' },
      })

      mockMenuMessage = new DidCommMenuMessage({
        title: 'incoming title',
        description: 'incoming description',
        options: [
          {
            title: 'incoming option 1 title',
            description: 'incoming option 1 description',
            name: 'incoming option 1 name',
          },
        ],
      })
    })

    it('emits event and creates record when no previous record', async () => {
      const messageContext = new DidCommInboundMessageContext(mockMenuMessage, {
        agentContext,
        connection: mockConnectionRecord,
      })

      const eventListenerMock = vi.fn()
      eventEmitter.on<DidCommActionMenuStateChangedEvent>(
        DidCommActionMenuEventTypes.DidCommActionMenuStateChanged,
        eventListenerMock
      )

      mockFunction(actionMenuRepository.findSingleByQuery).mockReturnValue(Promise.resolve(null))

      await actionMenuService.processMenu(messageContext)

      const expectedRecord = {
        connectionId: mockConnectionRecord.id,
        role: DidCommActionMenuRole.Requester,
        state: DidCommActionMenuState.PreparingSelection,
        threadId: messageContext.message.threadId,
        menu: expect.objectContaining({
          title: 'incoming title',
          description: 'incoming description',
          options: [
            {
              title: 'incoming option 1 title',
              description: 'incoming option 1 description',
              name: 'incoming option 1 name',
            },
          ],
        }),
        performedAction: undefined,
      }

      expect(actionMenuRepository.save).toHaveBeenCalledWith(agentContext, expect.objectContaining(expectedRecord))
      expect(actionMenuRepository.update).not.toHaveBeenCalled()

      expect(eventListenerMock).toHaveBeenCalledWith({
        type: DidCommActionMenuEventTypes.DidCommActionMenuStateChanged,
        metadata: {
          contextCorrelationId: 'mock',
        },
        payload: {
          previousState: null,
          actionMenuRecord: expect.objectContaining(expectedRecord),
        },
      })
    })

    it('emits event and updates record when existing record', async () => {
      const messageContext = new DidCommInboundMessageContext(mockMenuMessage, {
        agentContext,
        connection: mockConnectionRecord,
      })

      const eventListenerMock = vi.fn()
      eventEmitter.on<DidCommActionMenuStateChangedEvent>(
        DidCommActionMenuEventTypes.DidCommActionMenuStateChanged,
        eventListenerMock
      )

      // It should accept any previous state
      for (const state of Object.values(DidCommActionMenuState)) {
        mockRecord.state = state
        const previousState = state
        mockFunction(actionMenuRepository.findSingleByQuery).mockReturnValue(Promise.resolve(mockRecord))

        await actionMenuService.processMenu(messageContext)

        const expectedRecord = {
          connectionId: mockConnectionRecord.id,
          role: DidCommActionMenuRole.Requester,
          state: DidCommActionMenuState.PreparingSelection,
          threadId: messageContext.message.threadId,
          menu: expect.objectContaining({
            title: 'incoming title',
            description: 'incoming description',
            options: [
              {
                title: 'incoming option 1 title',
                description: 'incoming option 1 description',
                name: 'incoming option 1 name',
              },
            ],
          }),
          performedAction: undefined,
        }

        expect(actionMenuRepository.update).toHaveBeenCalledWith(agentContext, expect.objectContaining(expectedRecord))
        expect(actionMenuRepository.save).not.toHaveBeenCalled()

        expect(eventListenerMock).toHaveBeenCalledWith({
          type: DidCommActionMenuEventTypes.DidCommActionMenuStateChanged,
          metadata: {
            contextCorrelationId: 'mock',
          },
          payload: {
            previousState,
            actionMenuRecord: expect.objectContaining(expectedRecord),
          },
        })
      }
    })
  })

  describe('processPerform', () => {
    let mockRecord: DidCommActionMenuRecord

    beforeEach(() => {
      mockRecord = mockActionMenuRecord({
        connectionId: mockConnectionRecord.id,
        role: DidCommActionMenuRole.Responder,
        state: DidCommActionMenuState.AwaitingSelection,
        threadId: '123',
        menu: new DidCommActionMenu({
          description: 'menu-description',
          title: 'menu-title',
          options: [
            { name: 'opt1', title: 'opt1-title', description: 'opt1-desc' },
            { name: 'opt2', title: 'opt2-title', description: 'opt2-desc' },
          ],
        }),
      })
    })

    it('emits event and saves record when valid selection and thread Id', async () => {
      const mockPerformMessage = new DidCommPerformMessage({
        name: 'opt1',
        threadId: '123',
      })

      const messageContext = new DidCommInboundMessageContext(mockPerformMessage, {
        agentContext,
        connection: mockConnectionRecord,
      })

      const eventListenerMock = vi.fn()
      eventEmitter.on<DidCommActionMenuStateChangedEvent>(
        DidCommActionMenuEventTypes.DidCommActionMenuStateChanged,
        eventListenerMock
      )

      mockFunction(actionMenuRepository.findSingleByQuery).mockReturnValue(Promise.resolve(mockRecord))

      await actionMenuService.processPerform(messageContext)

      const expectedRecord = {
        connectionId: mockConnectionRecord.id,
        role: DidCommActionMenuRole.Responder,
        state: DidCommActionMenuState.Done,
        threadId: messageContext.message.threadId,
        menu: expect.objectContaining({
          description: 'menu-description',
          title: 'menu-title',
          options: [
            { name: 'opt1', title: 'opt1-title', description: 'opt1-desc' },
            { name: 'opt2', title: 'opt2-title', description: 'opt2-desc' },
          ],
        }),
        performedAction: { name: 'opt1' },
      }

      expect(actionMenuRepository.findSingleByQuery).toHaveBeenCalledWith(
        agentContext,
        expect.objectContaining({
          connectionId: mockConnectionRecord.id,
          role: DidCommActionMenuRole.Responder,
          threadId: messageContext.message.threadId,
        })
      )
      expect(actionMenuRepository.update).toHaveBeenCalledWith(agentContext, expect.objectContaining(expectedRecord))
      expect(actionMenuRepository.save).not.toHaveBeenCalled()

      expect(eventListenerMock).toHaveBeenCalledWith({
        type: DidCommActionMenuEventTypes.DidCommActionMenuStateChanged,
        metadata: {
          contextCorrelationId: 'mock',
        },
        payload: {
          previousState: DidCommActionMenuState.AwaitingSelection,
          actionMenuRecord: expect.objectContaining(expectedRecord),
        },
      })
    })

    it('throws error when invalid selection', async () => {
      const mockPerformMessage = new DidCommPerformMessage({
        name: 'fake',
        threadId: '123',
      })

      const messageContext = new DidCommInboundMessageContext(mockPerformMessage, {
        agentContext,
        connection: mockConnectionRecord,
      })

      const eventListenerMock = vi.fn()
      eventEmitter.on<DidCommActionMenuStateChangedEvent>(
        DidCommActionMenuEventTypes.DidCommActionMenuStateChanged,
        eventListenerMock
      )

      mockFunction(actionMenuRepository.findSingleByQuery).mockReturnValue(Promise.resolve(mockRecord))

      await expect(actionMenuService.processPerform(messageContext)).rejects.toThrow(
        'Selection does not match valid actions'
      )

      expect(actionMenuRepository.update).not.toHaveBeenCalled()
      expect(actionMenuRepository.save).not.toHaveBeenCalled()
      expect(eventListenerMock).not.toHaveBeenCalled()
    })

    it('throws error when record not found', async () => {
      const mockPerformMessage = new DidCommPerformMessage({
        name: 'opt1',
        threadId: '122',
      })

      const messageContext = new DidCommInboundMessageContext(mockPerformMessage, {
        agentContext,
        connection: mockConnectionRecord,
      })

      const eventListenerMock = vi.fn()
      eventEmitter.on<DidCommActionMenuStateChangedEvent>(
        DidCommActionMenuEventTypes.DidCommActionMenuStateChanged,
        eventListenerMock
      )

      mockFunction(actionMenuRepository.findSingleByQuery).mockReturnValue(Promise.resolve(null))

      await expect(actionMenuService.processPerform(messageContext)).rejects.toThrow(
        `No Action Menu found with thread id ${mockPerformMessage.threadId}`
      )

      expect(actionMenuRepository.update).not.toHaveBeenCalled()
      expect(actionMenuRepository.save).not.toHaveBeenCalled()
      expect(eventListenerMock).not.toHaveBeenCalled()
    })

    it('throws error when invalid state', async () => {
      const mockPerformMessage = new DidCommPerformMessage({
        name: 'opt1',
        threadId: '123',
      })

      const messageContext = new DidCommInboundMessageContext(mockPerformMessage, {
        agentContext,
        connection: mockConnectionRecord,
      })

      const eventListenerMock = vi.fn()
      eventEmitter.on<DidCommActionMenuStateChangedEvent>(
        DidCommActionMenuEventTypes.DidCommActionMenuStateChanged,
        eventListenerMock
      )

      mockRecord.state = DidCommActionMenuState.Done
      mockFunction(actionMenuRepository.findSingleByQuery).mockReturnValue(Promise.resolve(mockRecord))

      await expect(actionMenuService.processPerform(messageContext)).rejects.toThrow(
        `Action Menu record is in invalid state ${mockRecord.state}. Valid states are: ${DidCommActionMenuState.AwaitingSelection}.`
      )

      expect(actionMenuRepository.update).not.toHaveBeenCalled()
      expect(actionMenuRepository.save).not.toHaveBeenCalled()
      expect(eventListenerMock).not.toHaveBeenCalled()
    })

    it('throws problem report error when menu has been cleared', async () => {
      const mockPerformMessage = new DidCommPerformMessage({
        name: 'opt1',
        threadId: '123',
      })

      const messageContext = new DidCommInboundMessageContext(mockPerformMessage, {
        agentContext,
        connection: mockConnectionRecord,
      })

      const eventListenerMock = vi.fn()
      eventEmitter.on<DidCommActionMenuStateChangedEvent>(
        DidCommActionMenuEventTypes.DidCommActionMenuStateChanged,
        eventListenerMock
      )

      mockRecord.state = DidCommActionMenuState.Null
      mockFunction(actionMenuRepository.findSingleByQuery).mockReturnValue(Promise.resolve(mockRecord))

      await expect(actionMenuService.processPerform(messageContext)).rejects.toThrow(
        DidCommActionMenuProblemReportError
      )

      expect(actionMenuRepository.update).not.toHaveBeenCalled()
      expect(actionMenuRepository.save).not.toHaveBeenCalled()
      expect(eventListenerMock).not.toHaveBeenCalled()
    })
  })

  describe('DidCommActionMenuModuleConfig', () => {
    it('defaults strictStateChecking to true', () => {
      const config = new DidCommActionMenuModuleConfig({})
      expect(config.strictStateChecking).toBe(true)
    })

    it('allows setting strictStateChecking to false', () => {
      const config = new DidCommActionMenuModuleConfig({ strictStateChecking: false })
      expect(config.strictStateChecking).toBe(false)
    })

    it('allows setting strictStateChecking to true explicitly', () => {
      const config = new DidCommActionMenuModuleConfig({ strictStateChecking: true })
      expect(config.strictStateChecking).toBe(true)
    })
  })

  describe('strictStateChecking disabled', () => {
    let lenientService: DidCommActionMenuService

    beforeEach(() => {
      lenientService = new DidCommActionMenuService(
        actionMenuRepository,
        agentConfig,
        eventEmitter,
        new DidCommActionMenuModuleConfig({ strictStateChecking: false })
      )
    })

    describe('createMenu', () => {
      it('does not throw on invalid state when strictStateChecking is false', async () => {
        const testMenu = new DidCommActionMenu({
          description: 'menu-description',
          title: 'menu-title',
          options: [{ name: 'opt1', title: 'opt1-title', description: 'opt1-desc' }],
        })

        // AwaitingSelection is not a valid state for createMenu in strict mode
        const previousRecord = mockActionMenuRecord({
          connectionId: mockConnectionRecord.id,
          role: DidCommActionMenuRole.Responder,
          state: DidCommActionMenuState.AwaitingSelection,
          threadId: 'threadId-1',
        })

        mockFunction(actionMenuRepository.findSingleByQuery).mockReturnValue(Promise.resolve(previousRecord))

        await expect(
          lenientService.createMenu(agentContext, {
            connection: mockConnectionRecord,
            menu: testMenu,
          })
        ).resolves.toBeDefined()
      })

      it('throws on invalid state when strictStateChecking is true (default)', async () => {
        const testMenu = new DidCommActionMenu({
          description: 'menu-description',
          title: 'menu-title',
          options: [{ name: 'opt1', title: 'opt1-title', description: 'opt1-desc' }],
        })

        const previousRecord = mockActionMenuRecord({
          connectionId: mockConnectionRecord.id,
          role: DidCommActionMenuRole.Responder,
          state: DidCommActionMenuState.AwaitingSelection,
          threadId: 'threadId-1',
        })

        mockFunction(actionMenuRepository.findSingleByQuery).mockReturnValue(Promise.resolve(previousRecord))

        await expect(
          actionMenuService.createMenu(agentContext, {
            connection: mockConnectionRecord,
            menu: testMenu,
          })
        ).rejects.toThrow(
          `Action Menu record is in invalid state ${DidCommActionMenuState.AwaitingSelection}. Valid states are: ${DidCommActionMenuState.Null}, ${DidCommActionMenuState.PreparingRootMenu}, ${DidCommActionMenuState.Done}.`
        )
      })
    })

    describe('createPerform', () => {
      it('does not throw on invalid state when strictStateChecking is false', async () => {
        const testMenu = new DidCommActionMenu({
          description: 'menu-description',
          title: 'menu-title',
          options: [
            { name: 'opt1', title: 'opt1-title', description: 'opt1-desc' },
            { name: 'opt2', title: 'opt2-title', description: 'opt2-desc' },
          ],
        })

        // Done is not a valid state for createPerform in strict mode
        const mockRecord = mockActionMenuRecord({
          connectionId: mockConnectionRecord.id,
          role: DidCommActionMenuRole.Requester,
          state: DidCommActionMenuState.Done,
          threadId: '123',
          menu: testMenu,
        })

        await expect(
          lenientService.createPerform(agentContext, {
            actionMenuRecord: mockRecord,
            performedAction: { name: 'opt1' },
          })
        ).resolves.toBeDefined()
      })

      it('throws on invalid state when strictStateChecking is true (default)', async () => {
        const testMenu = new DidCommActionMenu({
          description: 'menu-description',
          title: 'menu-title',
          options: [
            { name: 'opt1', title: 'opt1-title', description: 'opt1-desc' },
            { name: 'opt2', title: 'opt2-title', description: 'opt2-desc' },
          ],
        })

        const mockRecord = mockActionMenuRecord({
          connectionId: mockConnectionRecord.id,
          role: DidCommActionMenuRole.Requester,
          state: DidCommActionMenuState.Done,
          threadId: '123',
          menu: testMenu,
        })

        await expect(
          actionMenuService.createPerform(agentContext, {
            actionMenuRecord: mockRecord,
            performedAction: { name: 'opt1' },
          })
        ).rejects.toThrow(
          `Action Menu record is in invalid state ${DidCommActionMenuState.Done}. Valid states are: ${DidCommActionMenuState.PreparingSelection}.`
        )
      })
    })

    describe('processPerform', () => {
      it('does not throw on invalid state when strictStateChecking is false', async () => {
        const mockRecord = mockActionMenuRecord({
          connectionId: mockConnectionRecord.id,
          role: DidCommActionMenuRole.Responder,
          state: DidCommActionMenuState.Done,
          threadId: '123',
          menu: new DidCommActionMenu({
            description: 'menu-description',
            title: 'menu-title',
            options: [
              { name: 'opt1', title: 'opt1-title', description: 'opt1-desc' },
              { name: 'opt2', title: 'opt2-title', description: 'opt2-desc' },
            ],
          }),
        })

        const mockPerformMessage = new DidCommPerformMessage({
          name: 'opt1',
          threadId: '123',
        })

        const messageContext = new DidCommInboundMessageContext(mockPerformMessage, {
          agentContext,
          connection: mockConnectionRecord,
        })

        mockFunction(actionMenuRepository.findSingleByQuery).mockReturnValue(Promise.resolve(mockRecord))

        await expect(lenientService.processPerform(messageContext)).resolves.not.toThrow()
      })

      it('still throws problem report when menu cleared regardless of strictStateChecking', async () => {
        const mockRecord = mockActionMenuRecord({
          connectionId: mockConnectionRecord.id,
          role: DidCommActionMenuRole.Responder,
          state: DidCommActionMenuState.Null,
          threadId: '123',
          menu: new DidCommActionMenu({
            description: 'menu-description',
            title: 'menu-title',
            options: [
              { name: 'opt1', title: 'opt1-title', description: 'opt1-desc' },
              { name: 'opt2', title: 'opt2-title', description: 'opt2-desc' },
            ],
          }),
        })

        const mockPerformMessage = new DidCommPerformMessage({
          name: 'opt1',
          threadId: '123',
        })

        const messageContext = new DidCommInboundMessageContext(mockPerformMessage, {
          agentContext,
          connection: mockConnectionRecord,
        })

        mockFunction(actionMenuRepository.findSingleByQuery).mockReturnValue(Promise.resolve(mockRecord))

        await expect(lenientService.processPerform(messageContext)).rejects.toThrow(DidCommActionMenuProblemReportError)
      })

      it('throws on invalid state when strictStateChecking is true (default)', async () => {
        const mockRecord = mockActionMenuRecord({
          connectionId: mockConnectionRecord.id,
          role: DidCommActionMenuRole.Responder,
          state: DidCommActionMenuState.Done,
          threadId: '123',
          menu: new DidCommActionMenu({
            description: 'menu-description',
            title: 'menu-title',
            options: [
              { name: 'opt1', title: 'opt1-title', description: 'opt1-desc' },
              { name: 'opt2', title: 'opt2-title', description: 'opt2-desc' },
            ],
          }),
        })

        const mockPerformMessage = new DidCommPerformMessage({
          name: 'opt1',
          threadId: '123',
        })

        const messageContext = new DidCommInboundMessageContext(mockPerformMessage, {
          agentContext,
          connection: mockConnectionRecord,
        })

        mockFunction(actionMenuRepository.findSingleByQuery).mockReturnValue(Promise.resolve(mockRecord))

        await expect(actionMenuService.processPerform(messageContext)).rejects.toThrow(
          `Action Menu record is in invalid state ${DidCommActionMenuState.Done}. Valid states are: ${DidCommActionMenuState.AwaitingSelection}.`
        )
      })
    })
  })

  describe('processRequest', () => {
    let mockRecord: DidCommActionMenuRecord
    let mockMenuRequestMessage: DidCommMenuRequestMessage

    beforeEach(() => {
      mockRecord = mockActionMenuRecord({
        connectionId: mockConnectionRecord.id,
        role: DidCommActionMenuRole.Responder,
        state: DidCommActionMenuState.PreparingRootMenu,
        threadId: '123',
        menu: new DidCommActionMenu({
          description: 'menu-description',
          title: 'menu-title',
          options: [
            { name: 'opt1', title: 'opt1-title', description: 'opt1-desc' },
            { name: 'opt2', title: 'opt2-title', description: 'opt2-desc' },
          ],
        }),
        performedAction: { name: 'opt1' },
      })

      mockMenuRequestMessage = new DidCommMenuRequestMessage({})
    })

    it('emits event and creates record when no previous record', async () => {
      const messageContext = new DidCommInboundMessageContext(mockMenuRequestMessage, {
        agentContext,
        connection: mockConnectionRecord,
      })

      const eventListenerMock = vi.fn()
      eventEmitter.on<DidCommActionMenuStateChangedEvent>(
        DidCommActionMenuEventTypes.DidCommActionMenuStateChanged,
        eventListenerMock
      )

      mockFunction(actionMenuRepository.findSingleByQuery).mockReturnValue(Promise.resolve(null))

      await actionMenuService.processRequest(messageContext)

      const expectedRecord = {
        connectionId: mockConnectionRecord.id,
        role: DidCommActionMenuRole.Responder,
        state: DidCommActionMenuState.PreparingRootMenu,
        threadId: messageContext.message.threadId,
        menu: undefined,
        performedAction: undefined,
      }

      expect(actionMenuRepository.save).toHaveBeenCalledWith(agentContext, expect.objectContaining(expectedRecord))
      expect(actionMenuRepository.update).not.toHaveBeenCalled()

      expect(eventListenerMock).toHaveBeenCalledWith({
        type: DidCommActionMenuEventTypes.DidCommActionMenuStateChanged,
        metadata: {
          contextCorrelationId: 'mock',
        },
        payload: {
          previousState: null,
          actionMenuRecord: expect.objectContaining(expectedRecord),
        },
      })
    })

    it('emits event and updates record when existing record', async () => {
      const messageContext = new DidCommInboundMessageContext(mockMenuRequestMessage, {
        agentContext,
        connection: mockConnectionRecord,
      })

      const eventListenerMock = vi.fn()
      eventEmitter.on<DidCommActionMenuStateChangedEvent>(
        DidCommActionMenuEventTypes.DidCommActionMenuStateChanged,
        eventListenerMock
      )

      // It should accept any previous state
      for (const state of Object.values(DidCommActionMenuState)) {
        mockRecord.state = state
        const previousState = state
        mockFunction(actionMenuRepository.findSingleByQuery).mockReturnValue(Promise.resolve(mockRecord))

        await actionMenuService.processRequest(messageContext)

        const expectedRecord = {
          connectionId: mockConnectionRecord.id,
          role: DidCommActionMenuRole.Responder,
          state: DidCommActionMenuState.PreparingRootMenu,
          threadId: messageContext.message.threadId,
          menu: undefined,
          performedAction: undefined,
        }

        expect(actionMenuRepository.update).toHaveBeenCalledWith(agentContext, expect.objectContaining(expectedRecord))
        expect(actionMenuRepository.save).not.toHaveBeenCalled()

        expect(eventListenerMock).toHaveBeenCalledWith({
          type: DidCommActionMenuEventTypes.DidCommActionMenuStateChanged,
          metadata: {
            contextCorrelationId: 'mock',
          },
          payload: {
            previousState,
            actionMenuRecord: expect.objectContaining(expectedRecord),
          },
        })
      }
    })
  })
})
