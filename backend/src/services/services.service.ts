import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class ServicesService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.service.findMany({
      where: { is_active: true },
      orderBy: { name: 'asc' },
    });
  }

  create(data: { name: string; base_price: number; expected_duration_min?: number }) {
    return this.prisma.service.create({ data });
  }

  update(id: string, data: any) {
    return this.prisma.service.update({
      where: { id },
      data,
    });
  }
}