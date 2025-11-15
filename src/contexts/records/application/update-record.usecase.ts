import { Inject, Injectable } from '@nestjs/common';
import { RecordModel } from '../domain/models/record.model';
import {
  RECORDS_REPOSITORY,
  RecordsRepository,
} from '../domain/repositories/records.repository';
import { CreateRecordInput } from './dtos/create-record.input';
import { UpdateRecordInput } from './dtos/update-record.input';
import { RecordOutput } from './outputs/record.output';

@Injectable()
export class UpdateRecordUseCase {
  constructor(
    @Inject(RECORDS_REPOSITORY)
    private readonly repo: RecordsRepository<
      RecordModel,
      CreateRecordInput,
      UpdateRecordInput
    >,
  ) {}

  async execute(id: string, dto: UpdateRecordInput): Promise<RecordOutput> {
    const updated = await this.repo.updateById(id, dto);
    return RecordOutput.fromModel(updated);
  }
}
