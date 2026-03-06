"use client";

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Plus, Trash2, Wallet } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function DataPage() {
  const queryClient = useQueryClient();
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  // Pestañas activas para separar vistas (por defecto vemos INSUMOS)
  const [activeTab, setActiveTab] = useState('INSUMOS');

  const { data: expenses } = useQuery({
    queryKey: ['expenses'],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/expenses`);
      return res.data;
    }
  });

  const addExpenseMutation = useMutation({
    mutationFn: async () => {
      await axios.post(`${API_URL}/expenses`, {
        description: expenseDesc,
        amount: Number(expenseAmount),
        category: activeTab
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      setExpenseDesc('');
      setExpenseAmount('');
    }
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`${API_URL}/expenses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    }
  });

  const formatearDinero = (val: number) => 
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(val || 0);

  // Filtrar gastos según la pestaña activa
  const filteredExpenses = expenses?.filter((exp: any) => exp.category === activeTab) || [];

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-5xl mx-auto h-full overflow-y-auto w-full">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Cargar Datos</h1>
        <p className="text-sm md:text-base text-zinc-400 mt-1">Gestión administrativa de gastos operativos de la barbería</p>
      </div>

      {/* Tabs Layout */}
      <div className="flex w-full bg-zinc-900/50 p-1.5 rounded-2xl border border-zinc-800 overflow-x-auto whitespace-nowrap hide-scrollbar gap-2">
        {['INSUMOS', 'SUELDOS', 'IMPUESTOS', 'ALQUILER', 'OTROS'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 min-w-[100px] text-xs md:text-sm font-medium py-3 px-4 rounded-xl transition-all duration-200 ${
              activeTab === tab 
              ? 'bg-emerald-500/10 text-emerald-400 shadow-sm border border-emerald-500/20' 
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 border border-transparent'
            }`}
          >
            {tab.charAt(0) + tab.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulario Lateral */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col shadow-lg h-fit">
          <div className="flex items-center gap-3 mb-6 border-b border-zinc-800 pb-4">
            <Wallet className="w-6 h-6 text-emerald-500" />
            <h2 className="text-lg font-semibold text-zinc-100">Cargar {activeTab.charAt(0) + activeTab.slice(1).toLowerCase()}</h2>
          </div>
          
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex flex-col">
              <label className="text-sm text-zinc-400 mb-1">Descripción</label>
              <input 
                type="text" 
                placeholder="Ej: Detalles del gasto..." 
                value={expenseDesc}
                onChange={(e) => setExpenseDesc(e.target.value)}
                className="bg-zinc-950 border border-zinc-700 focus:border-emerald-500 rounded-lg p-3 text-white text-sm outline-none transition-colors"
              />
            </div>
            
            <div className="flex flex-col">
              <label className="text-sm text-zinc-400 mb-1">Monto ($)</label>
              <div className="flex gap-2">
                <input 
                  type="number" 
                  placeholder="0" 
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  className="bg-zinc-950 border border-zinc-700 focus:border-emerald-500 rounded-lg p-3 text-white text-sm outline-none flex-1 transition-colors w-full"
                />
              </div>
            </div>
          </div>
          
          <button 
            onClick={() => addExpenseMutation.mutate()}
            disabled={!expenseDesc || !expenseAmount}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:hover:bg-emerald-600 font-medium text-white px-6 py-3 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-md"
          >
            <Plus className="w-5 h-5" />
            Registrar Egreso
          </button>
        </div>

        {/* Historial Segmentado Lateral */}
        <div className="lg:col-span-2 bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-4 md:p-6">
          <h3 className="text-base md:text-lg font-semibold text-zinc-200 mb-4 border-b border-zinc-800 pb-3 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
            <span>Historial de {activeTab.charAt(0) + activeTab.slice(1).toLowerCase()}</span>
            <span className="text-sm text-zinc-400 font-normal">
              Total: <strong className="text-zinc-200">{formatearDinero(filteredExpenses.reduce((acc: number, curr: any) => acc + curr.amount, 0))}</strong>
            </span>
          </h3>
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {filteredExpenses.length === 0 && (
              <p className="text-zinc-500 text-sm italic text-center py-6">No hay gastos ingresados en esta categoría.</p>
            )}
            {filteredExpenses.map((exp: any) => (
              <div key={exp.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-zinc-950 rounded-xl border border-zinc-800/50 hover:border-zinc-700 transition-colors gap-3">
                <div>
                  <p className="font-medium text-zinc-200 text-sm md:text-base">{exp.description}</p>
                  <p className="text-xs md:text-sm text-zinc-500 mt-1">{new Date(exp.date).toLocaleDateString('es-AR')}</p>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-6 border-t border-zinc-800/50 sm:border-0 pt-3 sm:pt-0 mt-2 sm:mt-0">
                  <span className="text-rose-400 font-mono text-base md:text-lg font-semibold tracking-tight">
                    -{formatearDinero(exp.amount)}
                  </span>
                  <button 
                    onClick={() => deleteExpenseMutation.mutate(exp.id)} 
                    className="text-zinc-600 hover:text-rose-500 hover:bg-rose-500/10 p-2 rounded-lg transition-all"
                    title="Eliminar Gasto"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}