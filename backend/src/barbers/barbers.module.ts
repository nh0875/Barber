import { Module } from '@nestjs/common';
import { BarbersController } from './barbers.controller';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [BarbersController],
})
export class BarbersModule {}
