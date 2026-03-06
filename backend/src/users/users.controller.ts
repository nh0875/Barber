import { Controller, Get, Post, Body, Patch, Param } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('barbers') // Expuesto como barbers
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAllBarbers() {
    return this.usersService.findAllBarbers();
  }

  @Post()
  createBarber(@Body() body: any) {
    return this.usersService.createBarber(body);
  }

  @Patch(':id/activate')
  toggleActive(@Param('id') id: string, @Body('isActive') isActive: boolean) {
    return this.usersService.toggleActive(id, isActive);
  }
}