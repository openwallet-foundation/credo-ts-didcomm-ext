import path from 'node:path'
import { testRecordEncoding } from '../../../../../tests/recordEncoding'
import { DidCommActionMenuRole } from '../../DidCommActionMenuRole'
import { DidCommActionMenuState } from '../../DidCommActionMenuState'
import { DidCommActionMenu, DidCommActionMenuFormInputType, DidCommActionMenuSelection } from '../../models'
import { DidCommActionMenuRecord } from '../DidCommActionMenuRecord'

const createdAt = new Date('2026-01-01T00:00:00.000Z')
const updatedAt = new Date('2026-01-02T00:00:00.000Z')

testRecordEncoding(path.join(__dirname, '__fixtures__/records'), {
  ActionMenuRecord: () => {
    const record = new DidCommActionMenuRecord({
      id: 'action-menu-record-id',
      createdAt,
      tags: { custom: 'tag' },
      state: DidCommActionMenuState.Done,
      role: DidCommActionMenuRole.Requester,
      connectionId: 'connection-id',
      threadId: 'thread-id',
      menu: new DidCommActionMenu({
        title: 'Welcome',
        description: 'Choose an option',
        options: [
          {
            name: 'search',
            title: 'Search',
            description: 'Search the catalogue',
            disabled: false,
            form: {
              description: 'Enter your search',
              submitLabel: 'Search now',
              params: [
                {
                  name: 'query',
                  title: 'Query',
                  default: 'credentials',
                  description: 'The search query',
                  required: true,
                  type: DidCommActionMenuFormInputType.Text,
                },
              ],
            },
          },
          {
            name: 'help',
            title: 'Help',
            description: 'Get help',
            disabled: true,
          },
        ],
      }),
      performedAction: new DidCommActionMenuSelection({
        name: 'search',
        params: { query: 'credentials' },
      }),
    })
    record.updatedAt = updatedAt
    record.metadata.set('meta', { key: 'value' })
    return record
  },
})
