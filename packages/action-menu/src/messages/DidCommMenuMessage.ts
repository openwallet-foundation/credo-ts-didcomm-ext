import { DidCommMessage, IsValidMessageType, parseMessageType } from '@credo-ts/didcomm'
import { Expose, Type } from 'class-transformer'
import { IsInstance, IsOptional, IsString } from 'class-validator'
import type { DidCommActionMenuOptionOptions } from '../models'

import { DidCommActionMenuOption } from '../models'

/**
 * @internal
 */
export interface DidCommMenuMessageOptions {
  id?: string
  title: string
  description: string
  errorMessage?: string
  options: DidCommActionMenuOptionOptions[]
  threadId?: string
}

/**
 * @internal
 */
export class DidCommMenuMessage extends DidCommMessage {
  public constructor(options: DidCommMenuMessageOptions) {
    super()

    if (options) {
      this.id = options.id ?? this.generateId()
      this.title = options.title
      this.description = options.description
      this.errorMessage = options.errorMessage
      this.options = options.options.map((p) => new DidCommActionMenuOption(p))
      if (options.threadId) {
        this.setThread({
          threadId: options.threadId,
        })
      }
    }
  }

  public static readonly type = parseMessageType('https://didcomm.org/action-menu/1.0/menu')
  @IsValidMessageType(DidCommMenuMessage.type)
  public readonly type = DidCommMenuMessage.type.messageTypeUri

  @IsString()
  public title!: string

  @IsString()
  public description!: string

  @Expose({ name: 'errormsg' })
  @IsString()
  @IsOptional()
  public errorMessage?: string

  @IsInstance(DidCommActionMenuOption, { each: true })
  @Type(() => DidCommActionMenuOption)
  public options!: DidCommActionMenuOption[]
}
