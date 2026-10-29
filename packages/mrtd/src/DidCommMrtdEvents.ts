import type { BaseEvent } from '@credo-ts/core'
import type { DescriptionOptions, DidCommConnectionRecord } from '@credo-ts/didcomm'
import type { EMrtdData, MrzData } from './models'

export enum MrtdEventTypes {
  EMrtdDataReceived = 'EMrtdDataReceived',
  EMrtdDataRequested = 'EMrtdDataRequested',
  MrzDataReceived = 'MrzDataReceived',
  MrzDataRequested = 'MrzDataRequested',
  MrtdProblemReport = 'MrtdProblemReport',
}

export interface MrzDataReceivedEvent extends BaseEvent {
  type: MrtdEventTypes.MrzDataReceived
  payload: {
    connection: DidCommConnectionRecord
    mrzData: MrzData
    threadId: string
  }
}

export interface MrzDataRequestedEvent extends BaseEvent {
  type: MrtdEventTypes.MrzDataRequested
  payload: {
    connection: DidCommConnectionRecord
    threadId: string
    parentThreadId?: string
  }
}

export interface EMrtdDataReceivedEvent extends BaseEvent {
  type: MrtdEventTypes.EMrtdDataReceived
  payload: {
    connection: DidCommConnectionRecord
    dataGroups: EMrtdData
    threadId: string
  }
}

export interface EMrtdDataRequestedEvent extends BaseEvent {
  type: MrtdEventTypes.EMrtdDataRequested
  payload: {
    connection: DidCommConnectionRecord
    threadId: string
    parentThreadId?: string
  }
}

export interface MrtdProblemReportEvent extends BaseEvent {
  type: MrtdEventTypes.MrtdProblemReport
  payload: {
    connection: DidCommConnectionRecord
    description: DescriptionOptions
    threadId: string
    parentThreadId?: string
  }
}
