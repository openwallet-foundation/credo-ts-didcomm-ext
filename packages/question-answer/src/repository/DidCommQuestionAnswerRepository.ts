import { EventEmitter, InjectionSymbols, inject, injectable, Repository, type StorageService } from '@credo-ts/core'

import { DidCommQuestionAnswerRecord } from './DidCommQuestionAnswerRecord'

@injectable()
export class DidCommQuestionAnswerRepository extends Repository<DidCommQuestionAnswerRecord> {
  public constructor(
    @inject(InjectionSymbols.StorageService) storageService: StorageService<DidCommQuestionAnswerRecord>,
    eventEmitter: EventEmitter
  ) {
    super(DidCommQuestionAnswerRecord, storageService, eventEmitter)
  }
}
