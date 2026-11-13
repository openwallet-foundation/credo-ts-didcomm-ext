import type { RecordTags, TagsBase } from '@credo-ts/core'
import { BaseRecord, CredoError, utils } from '@credo-ts/core'
import type { DidCommDrpcRequest, DidCommDrpcResponse } from '../messages'
import type { DidCommDrpcRole, DidCommDrpcState } from '../models'

export type CustomDidCommDrpcMessageTags = TagsBase
export type DefaultDidCommDrpcMessageTags = {
  connectionId: string
  threadId: string
}

export type DidCommDrpcMessageTags = RecordTags<DidCommDrpcRecord>

export interface DidCommDrpcStorageProps {
  id?: string
  connectionId: string
  role: DidCommDrpcRole
  tags?: CustomDidCommDrpcMessageTags
  request?: DidCommDrpcRequest
  response?: DidCommDrpcResponse
  state: DidCommDrpcState
  threadId: string
}

export class DidCommDrpcRecord extends BaseRecord<DefaultDidCommDrpcMessageTags, CustomDidCommDrpcMessageTags> {
  public request?: DidCommDrpcRequest
  public response?: DidCommDrpcResponse
  public connectionId!: string
  public role!: DidCommDrpcRole
  public state!: DidCommDrpcState
  public threadId!: string

  public static readonly type = 'DrpcRecord'
  public readonly type = DidCommDrpcRecord.type

  public constructor(props: DidCommDrpcStorageProps) {
    super()

    if (props) {
      this.id = props.id ?? utils.uuid()
      this.request = props.request
      this.response = props.response
      this.connectionId = props.connectionId
      this._tags = props.tags ?? {}
      this.role = props.role
      this.state = props.state
      this.threadId = props.threadId
    }
  }

  public getTags() {
    return {
      ...this._tags,
      connectionId: this.connectionId,
      threadId: this.threadId,
    }
  }

  public assertRole(expectedRole: DidCommDrpcRole) {
    if (this.role !== expectedRole) {
      throw new CredoError(`Invalid DRPC record role ${this.role}, expected is ${expectedRole}.`)
    }
  }

  public assertState(expectedStates: DidCommDrpcState | DidCommDrpcState[]) {
    if (!Array.isArray(expectedStates)) {
      expectedStates = [expectedStates]
    }

    if (!expectedStates.includes(this.state)) {
      throw new CredoError(
        `DRPC response record is in invalid state ${this.state}. Valid states are: ${expectedStates.join(', ')}.`
      )
    }
  }
}
