// src/cuts/cuts.controller.ts
import { Controller, Post, Param, Body, Get, Query, UseGuards } from '@nestjs/common';
import { CutsService } from './cuts.service';
import { CreateCheckinDto, PayCutDto } from './dto/cut.dto';

@Controller('cuts')
// @UseGuards(JwtAuthGuard) 
export class CutsController {
  constructor(private readonly cutsService: CutsService) {}

  @Post('checkin')
  checkin(@Body() body: CreateCheckinDto) {
    return this.cutsService.checkin(body.clientId, body.serviceId, body.barberId);
  }

  @Post(':id/start')
  start(@Param('id') id: string) {
    return this.cutsService.start(id);
  }

  @Post(':id/finish')
  finish(@Param('id') id: string) {
    return this.cutsService.finish(id);
  }

  @Post(':id/pay')
  pay(@Param('id') id: string, @Body() body: PayCutDto) {
    return this.cutsService.pay(id, body.method, body.amount);
  }

  @Get('board')
  getBoard(@Query('barberId') barberId?: string) {
    return this.cutsService.getBoard(barberId);
  }
}
