import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import * as bcrypt from 'bcrypt';

const UserRole = { ADMIN: 'ADMIN', BARBER: 'BARBER' };

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  findAllBarbers() {
    return this.prisma.user.findMany({
      where: { role: UserRole.BARBER },
      select: { id: true, name: true, username: true, is_active: true, role: true },
      orderBy: { name: 'asc' },
    });
  }

  async createBarber(data: any) {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(data.password, salt);

    const user = await this.prisma.user.create({
      data: {
        name: data.name,
        username: data.username,
        password_hash: hash,
        role: UserRole.BARBER,
      },
      select: { id: true, name: true, username: true, role: true },
    });
    return user;
  }

  toggleActive(id: string, is_active: boolean) {
    return this.prisma.user.update({
      where: { id },
      data: { is_active },
      select: { id: true, name: true, is_active: true },
    });
  }
}