// src/reports/reports.controller.ts
import { Controller, Get, Query } from '@nestjs/common';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('daily')
  getDaily(@Query('date') date: string, @Query('categories') categories?: string) {
    // Si no se pasa fecha, se asume hoy localmente
    const targetDate = date ? new Date(date) : new Date();
    return this.reportsService.getDailyMetrics(targetDate, categories);
  }

  @Get('weekly')
  getWeekly(@Query('weekStart') weekStart: string, @Query('categories') categories?: string) {
    const targetDate = weekStart ? new Date(weekStart) : new Date();
    return this.reportsService.getWeeklyMetrics(targetDate, categories);
  }

  @Get('monthly')
  getMonthly(@Query('month') month: string, @Query('categories') categories?: string) { // YYYY-MM
    return this.reportsService.getMonthlyMetrics(month, categories);
  }

  @Get('yearly')
  getYearly(@Query('year') year: string, @Query('categories') categories?: string) { // YYYY
    return this.reportsService.getYearlyMetrics(year, categories);
  }
}
