import { DidCommMessage, IsValidMessageType, parseMessageType } from '@credo-ts/didcomm'
import { IsOptional, IsString } from 'class-validator'

/**
 * @internal
 */
export interface DidCommPerformMessageOptions {
  id?: string
  name: string
  params?: Record<string, string>
  threadId: string
}

/**
 * @internal
 */
export class DidCommPerformMessage extends DidCommMessage {
  public constructor(options: DidCommPerformMessageOptions) {
    super()

    if (options) {
      this.id = options.id ?? this.generateId()
      this.name = options.name
      this.params = options.params
      this.setThread({
        threadId: options.threadId,
      })
    }
  }

  public static readonly type = parseMessageType('https://didcomm.org/action-menu/1.0/perform')
  @IsValidMessageType(DidCommPerformMessage.type)
  public readonly type = DidCommPerformMessage.type.messageTypeUri

  @IsString()
  public name!: string

  @IsString({ each: true })
  @IsOptional()
  public params?: Record<string, string>
}
