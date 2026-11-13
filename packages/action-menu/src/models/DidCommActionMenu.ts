import { Type } from 'class-transformer'
import { IsInstance, IsString } from 'class-validator'
import type { DidCommActionMenuOptionOptions } from './DidCommActionMenuOption'

import { DidCommActionMenuOption } from './DidCommActionMenuOption'

/**
 * @public
 */
export interface DidCommActionMenuOptions {
  title: string
  description: string
  options: DidCommActionMenuOptionOptions[]
}

/**
 * @public
 */
export class DidCommActionMenu {
  public constructor(options: DidCommActionMenuOptions) {
    if (options) {
      this.title = options.title
      this.description = options.description
      this.options = options.options.map((p) => new DidCommActionMenuOption(p))
    }
  }

  @IsString()
  public title!: string

  @IsString()
  public description!: string

  @IsInstance(DidCommActionMenuOption, { each: true })
  @Type(() => DidCommActionMenuOption)
  public options!: DidCommActionMenuOption[]
}
