import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class ExpensesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: { description: string; amount: number; category: string; date?: string }) {
    return this.prisma.expense.create({
      data: {
        description: data.description,
        amount: Number(data.amount),
        category: data.category || 'OTHER',
        date: data.date ? new Date(data.date) : new Date(),
      },
    });
  }

  async findAll() {
    return this.prisma.expense.findMany({
      orderBy: { date: 'desc' }
    });
  }

  async remove(id: string) {
    return this.prisma.expense.delete({ where: { id } });
  }
}

