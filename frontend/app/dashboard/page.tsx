"use client";

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Filter, DollarSign, Scissors, TrendingUp, TrendingDown, LayoutDashboard } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const CATEGORIES = [
  { id: 'INSUMOS', label: 'Insumos' },
  { id: 'SUELDOS', label: 'Sueldos' },
  { id: 'IMPUESTOS', label: 'Impuestos' },
  { id: 'ALQUILER', label: 'Alquiler' },
  { id: 'OTROS', label: 'Otros' }
];

export default function DashboardPage() {
  const [timeFilter, setTimeFilter] = useState('daily'); // daily, weekly, monthly
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    CATEGORIES.map(c => c.id)
  ); // By default all are selected
  
  const toggleCategory = (id: string) => {
    setSelectedCategories(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const { data: metrics } = useQuery({
    queryKey: ['report-metrics', timeFilter, selectedCategories],
    queryFn: async () => {
      let endpoint = timeFilter;
      const catsParam = selectedCategories.length > 0 ? `&categories=${selectedCategories.join(',')}` : '&categories=NONE';
      
      if (timeFilter === 'yearly') {
        const res = await axios.get(`${API_URL}/reports/yearly?year=${new Date().getFullYear()}${catsParam}`);
        return res.data;
      } else if (timeFilter === 'daily') {
        const res = await axios.get(`${API_URL}/reports/daily?date=${new Date().toISOString()}${catsParam}`);
        return res.data;
      } else {
        const res = await axios.get(`${API_URL}/reports/${endpoint}?dummy=1${catsParam}`);
        return res.data;
      }
    }
  });

  const { data: yearly } = useQuery({
    queryKey: ['report-yearly', selectedCategories],
    queryFn: async () => {
      const catsParam = selectedCategories.length > 0 ? `&categories=${selectedCategories.join(',')}` : '&categories=NONE';
      const res = await axios.get(`${API_URL}/reports/yearly?year=${new Date().getFullYear()}${catsParam}`);
      return res.data; 
    }
  });

  const formatearDinero = (val: number) => 
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(val || 0);

  // Mapeamos para el chart de Recharts
  const mesesText = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const chartData = yearly?.ingresos_mensuales?.map((val: number, i: number) => ({
    name: mesesText[i],
    Ingresos: val,
    Egresos: yearly?.egresos_mensuales?.[i] || 0
  })) || [];

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8 max-w-7xl mx-auto h-full overflow-y-auto w-full">
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 bg-zinc-900 border border-zinc-800 p-4 md:p-6 rounded-2xl shadow-sm">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight flex items-center gap-2 md:gap-3">
            <LayoutDashboard className="w-6 h-6 md:w-8 md:h-8 text-emerald-500" />
            Estadísticas Globales
          </h1>
          <p className="text-sm md:text-base text-zinc-400 mt-1 md:mt-2">Métricas financieras integrales e historial de la barbería</p>
        </div>
        <div className="relative w-full md:w-auto">
          <select 
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
            className="appearance-none bg-zinc-950/80 w-full md:w-auto border border-zinc-700 hover:border-emerald-500/50 text-white rounded-xl py-3 pl-4 pr-10 outline-none cursor-pointer transition-all shadow-inner font-medium min-w-[150px]"
          >
            <option value="daily">Día</option>
            <option value="weekly">Semana</option>
            <option value="monthly">Mes</option>
            <option value="yearly">Año</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-zinc-400">
            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
          </div>
        </div>
      </div>

      {/* Filter Categories for Expenses */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center gap-3 shadow-sm">
        <div className="flex items-center gap-2 text-zinc-400 shrink-0">
          <Filter className="w-5 h-5" />
          <span className="text-sm font-medium">Filtrar Egresos:</span>
        </div>
        <div className="flex flex-wrap gap-2 w-full">
          {CATEGORIES.map(cat => {
            const isSelected = selectedCategories.includes(cat.id);
            return (
              <button
                key={cat.id}
                onClick={() => toggleCategory(cat.id)}
                className={`px-3 py-1.5 md:px-4 md:py-2 rounded-xl text-xs md:text-sm font-medium transition-all flex-grow md:flex-grow-0 sm:flex-none ${
                  isSelected 
                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                    : 'bg-zinc-950/80 text-zinc-500 border border-zinc-800 hover:border-zinc-700'
                }`}
              >
                {cat.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard 
          title="Ingresos"
          value={formatearDinero(metrics?.total_pagado || metrics?.ingresos_totales || 0)} 
          icon={TrendingUp} 
          color="text-emerald-400" 
          bg="bg-emerald-400/10"
        />
        <KpiCard 
          title="Egresos" 
          value={formatearDinero(metrics?.total_egresos || 0)} 
          icon={TrendingDown} 
          color="text-rose-400" 
          bg="bg-rose-400/10"
        />
        <KpiCard 
          title="Ganancia Neta" 
          value={formatearDinero(metrics?.ganancia_neta || 0)} 
          icon={DollarSign} 
          color="text-indigo-400" 
          bg="bg-indigo-400/10"
        />
        <KpiCard 
          title="Cortes" 
          value={metrics?.total_cortes !== undefined ? metrics.total_cortes : '-'} 
          icon={Scissors} 
          color="text-blue-400" 
          bg="bg-blue-400/10"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Grafico Anual LineChart */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 md:p-6 lg:col-span-2">
          <h3 className="text-base md:text-lg font-semibold text-zinc-100 mb-6">Evolución Anual - Ingresos vs Egresos</h3>
          <div className="h-64 md:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#a1a1aa" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                  tickMargin={10}
                />
                <YAxis 
                  stroke="#a1a1aa" 
                  fontSize={10} 
                  tickFormatter={(value) => `$${value/1000}k`}
                  tickLine={false} 
                  axisLine={false}
                  width={60}
                />
                <Tooltip 
                  cursor={{ fill: '#27272a' }}
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px', fontSize: '12px' }}
                  formatter={(value: number) => formatearDinero(value)}
                />
                <Bar dataKey="Ingresos" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="Egresos" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Resumen Adicional */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 md:p-6 flex flex-col gap-6">
          <div>
            <h3 className="text-base md:text-lg font-semibold text-zinc-100 mb-4 border-b border-zinc-800 pb-3">Rendimiento Operativo</h3>
            <div className="flex items-center justify-between p-4 bg-zinc-950 border border-zinc-800/80 rounded-xl">
              <div>
                <p className="text-xs md:text-sm font-medium text-zinc-400">Cortes por Hora</p>
                <p className="text-xl md:text-2xl font-bold text-zinc-100 mt-1">{metrics?.cortes_promedio_por_hora !== undefined ? `${metrics.cortes_promedio_por_hora}` : '-'}</p>
              </div>
              <div className="p-2 md:p-3 bg-orange-500/10 rounded-xl text-orange-400">
                <Scissors className="w-5 h-5 md:w-6 md:h-6" />
              </div>
            </div>
            <p className="text-[10px] md:text-xs text-zinc-500 mt-2 text-center">Calculado en base a turnos laborales estandar</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ title, value, icon: Icon, color, bg }: any) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 md:p-5 flex items-center gap-3 md:gap-4 transition-transform hover:scale-[1.02] cursor-default">
      <div className={`p-3 md:p-4 rounded-xl shrink-0 ${bg} ${color}`}>
        <Icon className="w-5 h-5 md:w-6 md:h-6" />
      </div>
      <div className="min-w-0">
        <p className="text-xs md:text-sm text-zinc-400 font-medium truncate">{title}</p>
        <p className="text-lg md:text-2xl font-bold text-zinc-100 mt-0.5 md:mt-1 truncate">{value}</p>
      </div>
    </div>
  );
}
