import { Expose, Type } from 'class-transformer'
import { IsInstance, IsString } from 'class-validator'
import type { DidCommActionMenuFormParameterOptions } from './DidCommActionMenuOptionFormParameter'

import { DidCommActionMenuFormParameter } from './DidCommActionMenuOptionFormParameter'

/**
 * @public
 */
export interface DidCommActionMenuFormOptions {
  description: string
  params: DidCommActionMenuFormParameterOptions[]
  submitLabel: string
}

/**
 * @public
 */
export class DidCommActionMenuForm {
  public constructor(options: DidCommActionMenuFormOptions) {
    if (options) {
      this.description = options.description
      this.params = options.params.map((p) => new DidCommActionMenuFormParameter(p))
      this.submitLabel = options.submitLabel
    }
  }

  @IsString()
  public description!: string

  @Expose({ name: 'submit-label' })
  @IsString()
  public submitLabel!: string

  @IsInstance(DidCommActionMenuFormParameter, { each: true })
  @Type(() => DidCommActionMenuFormParameter)
  public params!: DidCommActionMenuFormParameter[]
}
