import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Controller('barbers')
export class BarbersController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async getAllBarbers() {
    return this.prisma.user.findMany({
      where: {
        OR: [
          { role: 'BARBER' },
          { role: 'ADMIN' }
        ]
      },
      select: { id: true, name: true, username: true, role: true, is_active: true }
    });
  }
}
