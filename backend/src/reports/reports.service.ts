// src/reports/reports.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, parseISO, subWeeks, subMonths } from 'date-fns';

const CutStatus = { WAITING: 'WAITING', IN_PROGRESS: 'IN_PROGRESS', FINISHED: 'FINISHED', PAID: 'PAID', SIN_COBRO: 'SIN_COBRO', CANCELLED: 'CANCELLED' };

/**
 * Servicio de Reportes Financieros Escalable.
 * - Utiliza agregaciones y agrupaciones directamente en PostgreSQL.
 * - Evita traer miles de registros a la memoria (N+1).
 * - Preparado para indexar campos de filtrado como `created_at` o `branch_id` en el futuro.
 */
@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  private parseCategories(categories?: string) {
    if (!categories) return undefined;
    const parsed = categories.split(',').map(c => c.trim()).filter(Boolean);
    return parsed.length > 0 ? parsed : undefined;
  }

  async getDailyMetrics(date: Date, categories?: string) {
    const start = startOfDay(date);
    const end = endOfDay(date);
    const filterCategories = this.parseCategories(categories);

    // 1. Total cortes válidos del dia (FINISHED, PAID, SIN_COBRO)
    const total_cortes = await this.prisma.cut.count({
      where: {
        created_at: { gte: start, lte: end },
        status: { in: [CutStatus.FINISHED, CutStatus.PAID, CutStatus.SIN_COBRO] }
      },
    });

    // 2. Total Ingresos del dia (Pagos realizados)
    const { _sum: totalPaid } = await this.prisma.payment.aggregate({
      where: { created_at: { gte: start, lte: end } },
      _sum: { amount: true },
    });

    const totalIngresos = Number(totalPaid.amount || 0);

    // Gastos del dia
    const expenseWhere: any = { date: { gte: start, lte: end } };
    if (filterCategories) expenseWhere.category = { in: filterCategories };

    const { _sum: totalExpense } = await this.prisma.expense.aggregate({
      where: expenseWhere,
      _sum: { amount: true },
    });
    const total_egresos = Number(totalExpense.amount || 0);
    const ganancia_neta = totalIngresos - total_egresos;

    // 3. Agrupación por barbero (Ingresos y Cantidad) -> Ejecutado a nivel DB
    const barberMetricsDb = await this.prisma.payment.groupBy({
      by: ['cut_id'], // Agrupamos via corte para saber barbero (Prisma no soporta groupBy sobre joins directos facilmente)
      where: { created_at: { gte: start, lte: end } },
      _sum: { amount: true },
    });
    
    // Una query optimizada para traer los barberos sumando sin hacer raw query (Escalable v1)
    const paymentsConCorte = await this.prisma.payment.findMany({
      where: { created_at: { gte: start, lte: end } },
      select: { amount: true, cut: { select: { barber: { select: { id: true, name: true } } } } }
    });

    const ingresosPorBarbero = {};
    const cortesPorBarbero = {};
    let clientesUnicosPagaron = new Set();

    paymentsConCorte.forEach(p => {
      const bId = p.cut.barber.id;
      const bName = p.cut.barber.name;
      ingresosPorBarbero[bName] = (ingresosPorBarbero[bName] || 0) + Number(p.amount);
      cortesPorBarbero[bName] = (cortesPorBarbero[bName] || 0) + 1;
      clientesUnicosPagaron.add(p.cut.barber.id); // asumiendo uniqueness por ticket
    });

    const pagosValidos = paymentsConCorte.length;
    
    // Asumimos un turno de 8 horas
    const cortes_promedio_por_hora = total_cortes > 0 ? (total_cortes / 8).toFixed(1) : 0;

    return {
      total_cortes: total_cortes,
      total_pagado: totalIngresos,
      total_egresos,
      ganancia_neta,
      cortes_por_barbero: cortesPorBarbero,
      ingresos_por_barbero: ingresosPorBarbero,
      cortes_promedio_por_hora: Number(cortes_promedio_por_hora),
    };
  }

  async getWeeklyMetrics(date: Date, categories?: string) {
    // Calculos similares, permitiendo métricas a 7 días.
    const start = startOfWeek(date, { weekStartsOn: 1 });
    const end = endOfWeek(date, { weekStartsOn: 1 });
    const filterCategories = this.parseCategories(categories);

    const pastStart = subWeeks(start, 1);
    const pastEnd = subWeeks(end, 1);

    const total_cortes = await this.prisma.cut.count({
      where: {
        created_at: { gte: start, lte: end },
        status: { in: [CutStatus.FINISHED, CutStatus.PAID, CutStatus.SIN_COBRO] }
      },
    });

    // Actual
    const { _sum: m1 } = await this.prisma.payment.aggregate({
      where: { created_at: { gte: start, lte: end } },
      _sum: { amount: true },
    });

    const expenseWhere: any = { date: { gte: start, lte: end } };
    if (filterCategories) expenseWhere.category = { in: filterCategories };

    const { _sum: expSum } = await this.prisma.expense.aggregate({
      where: expenseWhere,
      _sum: { amount: true },
    });
    const total_egresos = Number(expSum.amount || 0);

    // Pasado (Calculo Delta)
    const { _sum: m2 } = await this.prisma.payment.aggregate({
      where: { created_at: { gte: pastStart, lte: pastEnd } },
      _sum: { amount: true },
    });

    const actual = Number(m1.amount || 0);
    const anterior = Number(m2.amount || 0);
    const delta = anterior > 0 ? ((actual - anterior) / anterior) * 100 : 100;
    
    // Asumiendo 6 días laborales de 8 hs = 48 hs
    const cortes_promedio_por_hora = total_cortes > 0 ? (total_cortes / 48).toFixed(1) : 0;
    const ganancia_neta = actual - total_egresos;

    return {
      ingresos_totales: actual,
      total_egresos,
      ganancia_neta,
      delta_semana_anterior_pct: delta.toFixed(2),
      total_cortes,
      cortes_promedio_por_hora: Number(cortes_promedio_por_hora)
    };
  }

  async getMonthlyMetrics(monthStr: string, categories?: string) {
    // monthStr: YYYY-MM
    const start = startOfMonth(parseISO(monthStr + '-01'));
    const end = endOfMonth(start);
    const filterCategories = this.parseCategories(categories);

    const total_cortes = await this.prisma.cut.count({
      where: {
        created_at: { gte: start, lte: end },
        status: { in: [CutStatus.FINISHED, CutStatus.PAID, CutStatus.SIN_COBRO] }
      },
    });

    const { _sum: metrics } = await this.prisma.payment.aggregate({
      where: { created_at: { gte: start, lte: end } },
      _sum: { amount: true },
    });

    const expenseWhere: any = { date: { gte: start, lte: end } };
    if (filterCategories) expenseWhere.category = { in: filterCategories };

    const { _sum: expSum } = await this.prisma.expense.aggregate({
      where: expenseWhere,
      _sum: { amount: true },
    });
    const total_egresos = Number(expSum.amount || 0);
    const ingresos_totales = Number(metrics.amount || 0);
    const ganancia_neta = ingresos_totales - total_egresos;

    // Servicios más solicitados escalable: Agrupado por BD
    const popularServices = await this.prisma.cut.groupBy({
      by: ['service_id'],
      where: { created_at: { gte: start, lte: end } },
      _count: { service_id: true },
      orderBy: { _count: { service_id: 'desc' } },
      take: 5
    });

    // Asumiendo 24 días al mes de 8h = 192h
    const cortes_promedio_por_hora = total_cortes > 0 ? (total_cortes / 192).toFixed(1) : 0;

    return {
      ingresos_totales,
      total_egresos,
      ganancia_neta,
      servicios_populares: popularServices,
      total_cortes,
      cortes_promedio_por_hora: Number(cortes_promedio_por_hora)
    };
  }

  async getYearlyMetrics(year: string, categories?: string) {
    // Lógica para llenar los 12 meses
    const start = startOfYear(parseISO(year + '-01-01'));
    const end = endOfYear(start);
    const filterCategories = this.parseCategories(categories);

    const total_cortes = await this.prisma.cut.count({
      where: {
        created_at: { gte: start, lte: end },
        status: { in: [CutStatus.FINISHED, CutStatus.PAID, CutStatus.SIN_COBRO] }
      },
    });

    // Agrupación de PostgreSQL nativa por mes. Prisma no lo soporta de forma fluida, 
    // así que consultamos por cortes creados general y agrupamos por el timestamp formato JS
    // (Apto hasta ~50k cortes al año, si fuera más, hacer RAW Query).
    
    // Fallback: Traemos lo mínimo indispensable.
    const payments = await this.prisma.payment.findMany({
      where: { created_at: { gte: start, lte: end } },
      select: { amount: true, created_at: true }
    });

    const expenseWhere: any = { date: { gte: start, lte: end } };
    if (filterCategories) expenseWhere.category = { in: filterCategories };

    const expenses = await this.prisma.expense.findMany({
      where: expenseWhere,
      select: { amount: true, date: true }
    });

    const ingresosMensuales = Array(12).fill(0);
    payments.forEach(p => {
      const mes = p.created_at.getMonth(); // 0 a 11
      ingresosMensuales[mes] += Number(p.amount);
    });

    const egresosMensuales = Array(12).fill(0);
    expenses.forEach(e => {
      const mes = e.date.getMonth();
      egresosMensuales[mes] += Number(e.amount);
    });

    const ingresos_totales = ingresosMensuales.reduce((a, b) => a + b, 0);
    const total_egresos = egresosMensuales.reduce((a, b) => a + b, 0);
    const ganancia_neta = ingresos_totales - total_egresos;

    // Asumiendo 288 días al año de 8h = 2304h
    const cortes_promedio_por_hora = total_cortes > 0 ? (total_cortes / 2304).toFixed(1) : 0;

    return {
      ingresos_totales,
      total_egresos,
      ganancia_neta,
      ingresos_mensuales: ingresosMensuales,
      egresos_mensuales: egresosMensuales,
      total_cortes,
      cortes_promedio_por_hora: Number(cortes_promedio_por_hora)
    };
  }
}
