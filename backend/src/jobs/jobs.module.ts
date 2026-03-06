// src/jobs/jobs.module.ts
import { Module } from '@nestjs/common';
import { SinCobroCronService } from './sin-cobro.cron.service';
import { DatabaseModule } from '../database/database.module';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [DatabaseModule, RealtimeModule],
  providers: [SinCobroCronService],
})
export class JobsModule {}
