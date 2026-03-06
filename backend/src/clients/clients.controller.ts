import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ClientsService } from './clients.service';

@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Post()
  create(@Body() createClientDto: { fullName: string; phone: string }) {
    return this.clientsService.create(createClientDto.fullName, createClientDto.phone);
  }

  @Get('search')
  search(@Query('q') query: string) {
    if (!query) return [];
    return this.clientsService.search(query);
  }

  @Get(':id/history')
  getHistory(@Param('id') id: string, @Query('limit') limit = 20) {
    return this.clientsService.getHistory(id, +limit);
  }

  @Get(':id/suggest-last-service')
  getSuggestion(@Param('id') id: string, @Query('withinDays') days = 30) {
    return this.clientsService.suggestLastService(id, +days);
  }
}
