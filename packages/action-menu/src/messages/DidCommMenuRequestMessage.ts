import { DidCommMessage, IsValidMessageType, parseMessageType } from '@credo-ts/didcomm'

/**
 * @internal
 */
export interface DidCommMenuRequestMessageOptions {
  id?: string
}

/**
 * @internal
 */
export class DidCommMenuRequestMessage extends DidCommMessage {
  public constructor(options: DidCommMenuRequestMessageOptions) {
    super()

    if (options) {
      this.id = options.id ?? this.generateId()
    }
  }

  public static readonly type = parseMessageType('https://didcomm.org/action-menu/1.0/menu-request')
  @IsValidMessageType(DidCommMenuRequestMessage.type)
  public readonly type = DidCommMenuRequestMessage.type.messageTypeUri
}
