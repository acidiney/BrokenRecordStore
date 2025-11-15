import { Inject, Injectable } from '@nestjs/common';
import { RecordModel } from '../domain/models/record.model';
import { ListRecordsQuery } from '../domain/queries/list-records.query';
import {
  RECORDS_READ_REPOSITORY,
  RecordsReadRepository,
} from '../domain/repositories/records-read.repository';
import { RecordOutput } from './outputs/record.output';

@Injectable()
export class ListRecordsUseCase {
  constructor(
    @Inject(RECORDS_READ_REPOSITORY)
    private readonly readRepo: RecordsReadRepository<RecordModel>,
  ) {}

  async execute(query?: ListRecordsQuery): Promise<RecordOutput[]> {
    const records = await this.readRepo.findAll(query);
    return records.map(RecordOutput.fromModel);
  }
}
