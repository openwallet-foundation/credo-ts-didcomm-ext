import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator'

/**
 * @public
 */
export enum DidCommActionMenuFormInputType {
  Text = 'text',
}

/**
 * @public
 */
export interface DidCommActionMenuFormParameterOptions {
  name: string
  title: string
  default?: string
  description: string
  required?: boolean
  type?: DidCommActionMenuFormInputType
}

/**
 * @public
 */
export class DidCommActionMenuFormParameter {
  public constructor(options: DidCommActionMenuFormParameterOptions) {
    if (options) {
      this.name = options.name
      this.title = options.title
      this.default = options.default
      this.description = options.description
      this.required = options.required
      this.type = options.type
    }
  }

  @IsString()
  public name!: string

  @IsString()
  public title!: string

  @IsString()
  @IsOptional()
  public default?: string

  @IsString()
  public description!: string

  @IsBoolean()
  @IsOptional()
  public required?: boolean

  @IsEnum(DidCommActionMenuFormInputType)
  @IsOptional()
  public type?: DidCommActionMenuFormInputType
}
