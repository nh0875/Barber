import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { RealtimeModule } from './realtime/realtime.module';
import { CutsModule } from './cuts/cuts.module';
import { JobsModule } from './jobs/jobs.module';
import { ReportsModule } from './reports/reports.module';
import { ClientsModule } from './clients/clients.module';
import { ServicesModule } from './services/services.module';
import { UsersModule } from './users/users.module';
import { BarbersModule } from './barbers/barbers.module';
import { ExpensesModule } from './expenses/expenses.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule,
    DatabaseModule,
    RealtimeModule,
    AuthModule,
    CutsModule,
    JobsModule,
    ReportsModule,
    ClientsModule,
    ServicesModule,
    UsersModule,
    BarbersModule,
    ExpensesModule
  ],
})
export class AppModule {}
