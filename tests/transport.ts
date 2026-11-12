import type { Agent } from '@credo-ts/core'
import { Subject } from 'rxjs'
import type { SubjectMessage } from './transport/SubjectInboundTransport'
import { SubjectInboundTransport } from './transport/SubjectInboundTransport'
import { SubjectOutboundTransport } from './transport/SubjectOutboundTransport'

export function setupSubjectTransports(agents: Agent[]) {
  const subjectMap: Record<string, Subject<SubjectMessage>> = {}

  for (const agent of agents) {
    const messages = new Subject<SubjectMessage>()
    subjectMap[agent.didcomm.config.endpoints[0]] = messages
    agent.didcomm.registerInboundTransport(new SubjectInboundTransport(messages))
    agent.didcomm.registerOutboundTransport(new SubjectOutboundTransport(subjectMap))
  }
}
