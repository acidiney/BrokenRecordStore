import { Logger, Module, OnModuleInit } from '@nestjs/common';
import { InjectModel, MongooseModule } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RecordController } from './controllers/record.controller';
import { RecordDocument, RecordSchema } from './schemas/record.schema';
import { RecordService } from './services/record.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Record', schema: RecordSchema }]),
  ],
  controllers: [RecordController],
  providers: [RecordService],
})
export class RecordModule implements OnModuleInit {
  private readonly logger = new Logger(RecordModule.name);

  constructor(
    @InjectModel('Record')
    private readonly recordModel: Model<RecordDocument>,
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      await this.recordModel.syncIndexes();
    } catch (err) {
      const trace = err instanceof Error ? err.stack : String(err);
      this.logger.error('Failed to sync Record indexes', trace);
    }
  }
}
