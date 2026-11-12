import type { DidCommProblemReportMessageOptions } from '@credo-ts/didcomm'

import { DidCommProblemReportMessage, IsValidMessageType, parseMessageType } from '@credo-ts/didcomm'

export type DidCommActionMenuProblemReportMessageOptions = DidCommProblemReportMessageOptions

/**
 * @see https://github.com/hyperledger/aries-rfcs/blob/main/features/0035-report-problem/README.md
 * @internal
 */
export class DidCommActionMenuProblemReportMessage extends DidCommProblemReportMessage {
  public static readonly type = parseMessageType('https://didcomm.org/action-menu/1.0/problem-report')
  @IsValidMessageType(DidCommActionMenuProblemReportMessage.type)
  public readonly type = DidCommActionMenuProblemReportMessage.type.messageTypeUri
}
