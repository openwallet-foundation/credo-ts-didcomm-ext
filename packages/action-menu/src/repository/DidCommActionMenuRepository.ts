import { EventEmitter, InjectionSymbols, inject, injectable, Repository, type StorageService } from '@credo-ts/core'

import { DidCommActionMenuRecord } from './DidCommActionMenuRecord'

/**
 * @internal
 */
@injectable()
export class DidCommActionMenuRepository extends Repository<DidCommActionMenuRecord> {
  public constructor(
    @inject(InjectionSymbols.StorageService) storageService: StorageService<DidCommActionMenuRecord>,
    eventEmitter: EventEmitter
  ) {
    super(DidCommActionMenuRecord, storageService, eventEmitter)
  }
}
