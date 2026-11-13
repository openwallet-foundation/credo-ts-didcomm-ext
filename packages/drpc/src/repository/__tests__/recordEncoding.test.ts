import path from 'node:path'
import { testRecordEncoding } from '../../../../../tests/recordEncoding'
import { DidCommDrpcErrorCode, DidCommDrpcRole, DidCommDrpcState } from '../../models'
import { DidCommDrpcRecord } from '../DidCommDrpcRecord'

const createdAt = new Date('2026-01-01T00:00:00.000Z')
const updatedAt = new Date('2026-01-02T00:00:00.000Z')

testRecordEncoding(path.join(__dirname, '__fixtures__/records'), {
  'DrpcRecord.request': () => {
    const record = new DidCommDrpcRecord({
      id: 'drpc-record-id',
      tags: { custom: 'tag' },
      connectionId: 'connection-id',
      role: DidCommDrpcRole.Client,
      state: DidCommDrpcState.RequestSent,
      threadId: 'thread-id',
      request: { jsonrpc: '2.0', method: 'add', params: [1, 2], id: 1 },
    })
    record.createdAt = createdAt
    record.updatedAt = updatedAt
    record.metadata.set('meta', { key: 'value' })
    return record
  },
  'DrpcRecord.response': () => {
    const record = new DidCommDrpcRecord({
      id: 'drpc-record-id',
      tags: { custom: 'tag' },
      connectionId: 'connection-id',
      role: DidCommDrpcRole.Server,
      state: DidCommDrpcState.Completed,
      threadId: 'thread-id',
      request: [
        { jsonrpc: '2.0', method: 'add', params: { a: 1, b: 2 }, id: 'request-1' },
        { jsonrpc: '2.0', method: 'unknown', id: 'request-2' },
        { jsonrpc: '2.0', method: 'notify', params: [], id: null },
      ],
      response: [
        { jsonrpc: '2.0', result: 3, id: 'request-1' },
        {
          jsonrpc: '2.0',
          error: {
            code: DidCommDrpcErrorCode.METHOD_NOT_FOUND,
            message: 'Method not found',
            data: { method: 'unknown' },
          },
          id: 'request-2',
        },
        {},
      ],
    })
    record.createdAt = createdAt
    record.updatedAt = updatedAt
    record.metadata.set('meta', { key: 'value' })
    return record
  },
})
