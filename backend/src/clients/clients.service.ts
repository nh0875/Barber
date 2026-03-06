import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { subDays } from 'date-fns';

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  async create(fullName: string, phone: string) {
    return this.prisma.client.create({
      data: { full_name: fullName, phone },
    });
  }

  // Búsqueda óptima escalable: usa los índices @index de Prisma
  async search(query: string = '') {
    if (query.length < 2) return [];
    
    return this.prisma.client.findMany({
      where: {
        OR: [
          { full_name: { contains: query } },
          { phone: { contains: query } }
        ]
      },
      take: 10,
    });
  }

  async getHistory(clientId: string, limit: number) {
    return this.prisma.cut.findMany({
      where: { client_id: clientId },
      orderBy: { created_at: 'desc' },
      take: limit,
      include: { service: true, barber: true, payment: true }
    });
  }

  // Automatización solicitada: Sugerir si volvió < 30 días
  async suggestLastService(clientId: string, withinDays: number) {
    const limitDate = subDays(new Date(), withinDays);

    const lastCut = await this.prisma.cut.findFirst({
      where: {
        client_id: clientId,
        created_at: { gte: limitDate },
        status: { in: ['FINISHED', 'PAID', 'SIN_COBRO'] }
      },
      orderBy: { created_at: 'desc' },
      include: {
        service: true,
        barber: { select: { id: true, name: true } }
      }
    });

    if (!lastCut) return null;

    return {
      lastService: lastCut.service,
      lastBarber: lastCut.barber,
      lastCutDate: lastCut.created_at
    };
  }
}
