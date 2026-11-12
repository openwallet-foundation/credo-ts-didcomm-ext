import { EventEmitter, InjectionSymbols, inject, injectable, Repository, type StorageService } from '@credo-ts/core'

import { DidCommDrpcRecord } from './DidCommDrpcRecord'

@injectable()
export class DidCommDrpcRepository extends Repository<DidCommDrpcRecord> {
  public constructor(
    @inject(InjectionSymbols.StorageService) storageService: StorageService<DidCommDrpcRecord>,
    eventEmitter: EventEmitter
  ) {
    super(DidCommDrpcRecord, storageService, eventEmitter)
  }
}
