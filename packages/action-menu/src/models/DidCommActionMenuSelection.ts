import { IsOptional, IsString } from 'class-validator'

/**
 * @public
 */
export interface DidCommActionMenuSelectionOptions {
  name: string
  params?: Record<string, string>
}

/**
 * @public
 */
export class DidCommActionMenuSelection {
  public constructor(options: DidCommActionMenuSelectionOptions) {
    if (options) {
      this.name = options.name
      this.params = options.params
    }
  }

  @IsString()
  public name!: string

  @IsString({ each: true })
  @IsOptional()
  public params?: Record<string, string>
}
