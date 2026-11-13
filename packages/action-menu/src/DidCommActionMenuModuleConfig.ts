export interface DidCommActionMenuModuleConfigOptions {
  /**
   * Strict state checking for Action Menu
   *
   * If true, check current protocol state before executing an action. Otherwise, allow action processing regardless of previous action.
   *
   * @default true
   */
  strictStateChecking?: boolean
}

/**
 * @public
 */
export class DidCommActionMenuModuleConfig {
  private options: DidCommActionMenuModuleConfigOptions

  public constructor(options: DidCommActionMenuModuleConfigOptions) {
    this.options = options
  }

  public get strictStateChecking() {
    return this.options.strictStateChecking ?? true
  }
}
