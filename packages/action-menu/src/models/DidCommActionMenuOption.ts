import { Type } from 'class-transformer'
import { IsBoolean, IsInstance, IsOptional, IsString } from 'class-validator'
import type { DidCommActionMenuFormOptions } from './DidCommActionMenuOptionForm'

import { DidCommActionMenuForm } from './DidCommActionMenuOptionForm'

/**
 * @public
 */
export interface DidCommActionMenuOptionOptions {
  name: string
  title: string
  description: string
  disabled?: boolean
  form?: DidCommActionMenuFormOptions
}

/**
 * @public
 */
export class DidCommActionMenuOption {
  public constructor(options: DidCommActionMenuOptionOptions) {
    if (options) {
      this.name = options.name
      this.title = options.title
      this.description = options.description
      this.disabled = options.disabled
      if (options.form) {
        this.form = new DidCommActionMenuForm(options.form)
      }
    }
  }

  @IsString()
  public name!: string

  @IsString()
  public title!: string

  @IsString()
  public description!: string

  @IsBoolean()
  @IsOptional()
  public disabled?: boolean

  @IsInstance(DidCommActionMenuForm)
  @Type(() => DidCommActionMenuForm)
  @IsOptional()
  public form?: DidCommActionMenuForm
}
