import { EventEmitter, InjectionSymbols, inject, injectable, Repository, type StorageService } from '@credo-ts/core'

import { DidCommShortenUrlRecord } from './DidCommShortenUrlRecord'

@injectable()
export class DidCommShortenUrlRepository extends Repository<DidCommShortenUrlRecord> {
  public constructor(
    @inject(InjectionSymbols.StorageService)
    storageService: StorageService<DidCommShortenUrlRecord>,
    eventEmitter: EventEmitter
  ) {
    super(DidCommShortenUrlRecord, storageService, eventEmitter)
  }
}
