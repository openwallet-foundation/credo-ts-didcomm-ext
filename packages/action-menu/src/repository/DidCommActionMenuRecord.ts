import type { TagsBase } from '@credo-ts/core'
import { BaseRecord, CredoError, utils } from '@credo-ts/core'
import { Type } from 'class-transformer'
import type { DidCommActionMenuRole } from '../DidCommActionMenuRole'
import type { DidCommActionMenuState } from '../DidCommActionMenuState'

import { DidCommActionMenu, DidCommActionMenuSelection } from '../models'

/**
 * @public
 */
export interface DidCommActionMenuRecordProps {
  id?: string
  state: DidCommActionMenuState
  role: DidCommActionMenuRole
  createdAt?: Date
  connectionId: string
  threadId: string
  menu?: DidCommActionMenu
  performedAction?: DidCommActionMenuSelection
  tags?: CustomDidCommActionMenuTags
}

/**
 * @public
 */
export type CustomDidCommActionMenuTags = TagsBase

/**
 * @public
 */
export type DefaultDidCommActionMenuTags = {
  role: DidCommActionMenuRole
  connectionId: string
  threadId: string
}

/**
 * @public
 */
export class DidCommActionMenuRecord
  extends BaseRecord<DefaultDidCommActionMenuTags, CustomDidCommActionMenuTags>
  implements DidCommActionMenuRecordProps
{
  public state!: DidCommActionMenuState
  public role!: DidCommActionMenuRole
  public connectionId!: string
  public threadId!: string

  @Type(() => DidCommActionMenu)
  public menu?: DidCommActionMenu

  @Type(() => DidCommActionMenuSelection)
  public performedAction?: DidCommActionMenuSelection

  public static readonly type = 'ActionMenuRecord'
  public readonly type = DidCommActionMenuRecord.type

  public constructor(props: DidCommActionMenuRecordProps) {
    super()

    if (props) {
      this.id = props.id ?? utils.uuid()
      this.createdAt = props.createdAt ?? new Date()
      this.connectionId = props.connectionId
      this.threadId = props.threadId
      this.state = props.state
      this.role = props.role
      this.menu = props.menu
      this.performedAction = props.performedAction
      this._tags = props.tags ?? {}
    }
  }

  public getTags() {
    return {
      ...this._tags,
      role: this.role,
      connectionId: this.connectionId,
      threadId: this.threadId,
    }
  }

  public assertState(expectedStates: DidCommActionMenuState | DidCommActionMenuState[]) {
    if (!Array.isArray(expectedStates)) {
      expectedStates = [expectedStates]
    }

    if (!expectedStates.includes(this.state)) {
      throw new CredoError(
        `Action Menu record is in invalid state ${this.state}. Valid states are: ${expectedStates.join(', ')}.`
      )
    }
  }

  public assertRole(expectedRole: DidCommActionMenuRole) {
    if (this.role !== expectedRole) {
      throw new CredoError(`Action Menu record has invalid role ${this.role}. Expected role ${expectedRole}.`)
    }
  }
}
