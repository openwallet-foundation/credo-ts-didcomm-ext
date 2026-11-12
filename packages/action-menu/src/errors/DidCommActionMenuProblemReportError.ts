import type { DidCommProblemReportErrorOptions } from '@credo-ts/didcomm'
import { DidCommProblemReportError } from '@credo-ts/didcomm'
import { DidCommActionMenuProblemReportMessage } from '../messages'
import type { DidCommActionMenuProblemReportReason } from './DidCommActionMenuProblemReportReason'

/**
 * @internal
 */
interface ActionMenuProblemReportErrorOptions extends DidCommProblemReportErrorOptions {
  problemCode: DidCommActionMenuProblemReportReason
}

/**
 * @internal
 */
export class DidCommActionMenuProblemReportError extends DidCommProblemReportError {
  public problemReport: DidCommActionMenuProblemReportMessage

  public constructor(
    public message: string,
    { problemCode }: ActionMenuProblemReportErrorOptions
  ) {
    super(message, { problemCode })
    this.problemReport = new DidCommActionMenuProblemReportMessage({
      description: {
        en: message,
        code: problemCode,
      },
    })
  }
}
