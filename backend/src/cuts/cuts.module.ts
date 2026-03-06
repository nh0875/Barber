import { Module } from '@nestjs/common';
import { CutsService } from './cuts.service';
import { CutsController } from './cuts.controller';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [RealtimeModule],
  controllers: [CutsController],
  providers: [CutsService],
  exports: [CutsService],
})
export class CutsModule {}
