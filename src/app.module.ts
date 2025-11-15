import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RecordModule } from './api/records/record.module';
import { AppConfig } from './app.config';

@Module({
  imports: [MongooseModule.forRoot(AppConfig.mongoUrl), RecordModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
