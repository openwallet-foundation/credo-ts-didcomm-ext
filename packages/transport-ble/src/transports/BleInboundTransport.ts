import type { Ble } from '@animo-id/react-native-ble-didcomm'
import type { AgentContext, Logger } from '@credo-ts/core'
import { utils } from '@credo-ts/core'
import type { DidCommInboundTransport } from '@credo-ts/didcomm'
import { DidCommMessageReceiver, DidCommTransportService } from '@credo-ts/didcomm'
import type { EmitterSubscription } from 'react-native'

import { DidCommBleTransportSession } from './BleTransportSession'

export class DidCommBleInboundTransport implements DidCommInboundTransport {
  public supportedSchemes: string[] = ['ble']
  private messenger: Ble
  private messageListener?: EmitterSubscription
  private session!: DidCommBleTransportSession
  private disconnectionListener?: EmitterSubscription
  private logger?: Logger

  public constructor(messenger: Ble) {
    this.messenger = messenger
  }

  public async start(agentContext: AgentContext): Promise<void> {
    this.logger = agentContext.config.logger
    this.logger.debug('Starting BLE inbound transport')

    const sessionId = utils.uuid()
    this.session = new DidCommBleTransportSession(sessionId, this.messenger, agentContext)

    const messageListener = async (data: { message: string }) => {
      const message = data.message

      const messageReceiver = agentContext.dependencyManager.resolve(DidCommMessageReceiver)

      try {
        const encryptedMessage = await JSON.parse(message)

        await messageReceiver.receiveMessage(encryptedMessage, {
          session: this.session,
        })
      } catch (error) {
        this.logger?.error(`Error processing message: ${error}`)
      }
    }

    this.messageListener = this.messenger.registerMessageListener(messageListener)

    const disconnectionListener = async (data: { identifier: string }) => {
      this.logger?.debug('BLE disconnection detected', { data })

      const transportService = agentContext.dependencyManager.resolve(DidCommTransportService)
      transportService.removeSession(this.session)
    }

    this.disconnectionListener = this.messenger.registerOnDisconnectedListener(disconnectionListener)
  }

  public async stop(): Promise<void> {
    this.logger?.debug('Stopping BLE inbound transport')

    this.messageListener?.remove()
    this.disconnectionListener?.remove()
    await this.messenger.shutdown()
  }
}
