// src/cuts/cuts.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { RealtimeService } from '../realtime/realtime.service';

const CutStatus = { WAITING: 'WAITING', IN_PROGRESS: 'IN_PROGRESS', FINISHED: 'FINISHED', PAID: 'PAID', SIN_COBRO: 'SIN_COBRO', CANCELLED: 'CANCELLED' };
const PaymentMethod = { CASH: 'CASH', TRANSFER: 'TRANSFER', CARD: 'CARD' };

@Injectable()
export class CutsService {
  constructor(
    private prisma: PrismaService,
    private realtime: RealtimeService,
  ) {}

async checkin(clientId: string, serviceId: string, barberId?: string) {        
    const serviceInfo = await this.prisma.service.findUnique({ where: { id: serviceId } });                                                                         
    if (!serviceInfo) throw new NotFoundException('Service not found');

    const cut = await this.prisma.cut.create({
      data: {
        client_id: clientId,
        barber_id: barberId || null,
        service_id: serviceId,
        status: CutStatus.WAITING,
        price_snapshot: serviceInfo.base_price,
      },
      include: { client: true, barber: true, service: true },
    });

    this.realtime.emit('CUT_CREATED', cut);
    return cut;
  }

  async start(cutId: string) {
    const cut = await this.prisma.cut.findUnique({ where: { id: cutId } });
    if (!cut) throw new NotFoundException('Cut not found');
    if (cut.status !== CutStatus.WAITING) {
      throw new BadRequestException('Cannot start a cut that is not WAITING');
    }

    const updated = await this.prisma.cut.update({
      where: { id: cutId },
      data: { status: CutStatus.IN_PROGRESS, started_at: new Date() },
      include: { client: true, barber: true, service: true },
    });

    this.realtime.emit('CUT_UPDATED', updated);
    return updated;
  }

  async finish(cutId: string) {
    const cut = await this.prisma.cut.findUnique({ where: { id: cutId } });
    if (!cut) throw new NotFoundException('Cut not found');
    if (cut.status !== CutStatus.IN_PROGRESS) {
      throw new BadRequestException('Cannot finish a cut that is not IN_PROGRESS');
    }

    const updated = await this.prisma.cut.update({
      where: { id: cutId },
      data: { status: CutStatus.FINISHED, finished_at: new Date() },
      include: { client: true, barber: true, service: true },
    });

    this.realtime.emit('CUT_UPDATED', updated);
    return updated;
  }

  async pay(cutId: string, method: string, amount?: number) {
    const cut = await this.prisma.cut.findUnique({ where: { id: cutId } });
    if (!cut) throw new NotFoundException('Cut not found');
    
    // Puede cobrarse si está en state FINISHED o SIN_COBRO
    if (cut.status !== CutStatus.FINISHED && cut.status !== CutStatus.SIN_COBRO) {
      throw new BadRequestException(`Cannot pay a cut in status ${cut.status}`);
    }

    const paymentAmount = amount || cut.price_snapshot;

    const result = await this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          cut_id: cutId,
          method,
          amount: paymentAmount,
        },
      });

      const updatedCut = await tx.cut.update({
        where: { id: cutId },
        data: {
          status: CutStatus.PAID,
          paid_at: new Date(),
        },
        include: { client: true, barber: true, service: true, payment: true },
      });

      return updatedCut;
    });

    this.realtime.emit('PAYMENT_CREATED', result);
    this.realtime.emit('CUT_UPDATED', result);
    return result;
  }

  async updateCut(cutId: string, data: { status?: string, barberId?: string, serviceId?: string }) {
    const cut = await this.prisma.cut.findUnique({ where: { id: cutId } });
    if (!cut) throw new NotFoundException('Cut not found');

    if (data.status && data.status !== CutStatus.PAID && cut.status === CutStatus.PAID) {
      await this.prisma.payment.deleteMany({ where: { cut_id: cutId } });
    }

    const updated = await this.prisma.cut.update({
      where: { id: cutId },
      data: {
        ...(data.status ? { status: data.status, paid_at: data.status === CutStatus.PAID ? new Date() : null } : {}),
        ...(data.barberId !== undefined ? { barber_id: data.barberId || null } : {}),
        ...(data.serviceId ? { service_id: data.serviceId } : {}),
      },
      include: { client: true, barber: true, service: true, payment: true },
    });

    this.realtime.emit('CUT_UPDATED', updated);
    return updated;
  }

  async getBoard(barberId?: string) {
    // Calculamos el inicio del día en Argentina (UTC-3)
    const now = new Date();
    // formateamos a la fecha local de Arg
    const argDateString = new Intl.DateTimeFormat('en-US', { 
      timeZone: 'America/Argentina/Buenos_Aires', 
      year: 'numeric', month: '2-digit', day: '2-digit' 
    }).format(now);
    
    const [month, day, year] = argDateString.split('/');
    // Esto crea un Date object que representa las 00:00:00 de hoy en Argentina, expresado en UTC internamente.
    const todayArg = new Date(`${year}-${month}-${day}T00:00:00.000-03:00`);

    return this.prisma.cut.findMany({
      where: {
        ...(barberId ? { barber_id: barberId } : {}),
        OR: [
          // Cortes activos o finalizados que todavía no se pagaron
          { status: { in: [CutStatus.WAITING, CutStatus.IN_PROGRESS, CutStatus.FINISHED, CutStatus.SIN_COBRO] } },
          // O cortes pagados, pero SOLA y ÚNICAMENTE que hayan finalizado/pagado hoy (desde las 00:00 Arg)
          { 
             status: CutStatus.PAID,
             paid_at: { gte: todayArg }
          }
        ]
      },
      include: { client: true, barber: true, service: true, payment: true },
      orderBy: { created_at: 'asc' }
    });
  }
}
