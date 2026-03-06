import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../database/prisma.service';
import { RealtimeService } from '../realtime/realtime.service';
import { subHours } from 'date-fns';

@Injectable()
export class SinCobroCronService {
  private readonly logger = new Logger(SinCobroCronService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeService,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleSinCobroCheck() {
    this.logger.debug('Running SIN_COBRO cron check...');
    
    // Calcula la fecha y hora de hace 2 horas respecto a UTC/servidor
    const twoHoursAgo = subHours(new Date(), 2);

    const affectedRecords = await this.prisma.cut.updateMany({
      where: {
        status: 'FINISHED',
        finished_at: {
          lte: twoHoursAgo,
        },
        payment: {
          is: null, // Que no exista relation de pago
        },
      },
      data: {
        status: 'SIN_COBRO',
      },
    });

    if (affectedRecords.count > 0) {
      this.logger.log(`Updated ${affectedRecords.count} cuts to SIN_COBRO`);
      this.realtime.emit('BOARD_REFRESH');
    }
  }
}
