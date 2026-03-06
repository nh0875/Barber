"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useRealtime } from '../../lib/hooks/useRealtime';
import BoardColumn from './components/BoardColumn';
import QuickCheckinModal from './components/QuickCheckinModal';
import { useState, useEffect } from 'react';
import { useAuthStore } from '../../lib/store/useAuthStore';
import { useRouter } from 'next/navigation';
import { Filter } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function BoardPage() {
  const [isCheckinOpen, setCheckinOpen] = useState(false);
  const { user } = useAuthStore();
  const [selectedBarberFilter, setSelectedBarberFilter] = useState('');
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user) router.push('/login');
    // Si el usuario es barbero, forzamos de inmediato que su id sea el filtro backend
    if (user?.role === 'BARBER') setSelectedBarberFilter(user.id);
  }, [user, router]);

  useRealtime(`${API_URL}/events`);

  // Agregamos barbers solo para el select del Admin
  const { data: barbers } = useQuery({
    queryKey: ['barbers-list'],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/barbers`);
      return res.data;
    },
    enabled: user?.role === 'ADMIN'
  });

  const { data: cuts, isLoading } = useQuery({
    queryKey: ['board-cuts', selectedBarberFilter],
    queryFn: async () => {
      const url = selectedBarberFilter ? `${API_URL}/cuts/board?barberId=${selectedBarberFilter}` : `${API_URL}/cuts/board`;
      const res = await axios.get(url);
      return res.data;
    },
    enabled: !!user // Solo cargar si hay user
  });

  const cutsWaiting = cuts?.filter((c: any) => c.status === 'WAITING') || [];
  const cutsInProgress = cuts?.filter((c: any) => c.status === 'IN_PROGRESS') || [];
  const cutsFinished = cuts?.filter((c: any) => c.status === 'FINISHED' || c.status === 'SIN_COBRO') || [];
  const cutsPaid = cuts?.filter((c: any) => c.status === 'PAID') || [];

  // Calcular la cantidad de cortes terminados hoy por el barbero autenticado
  const myCompletedCutsToday = (cutsFinished.length + cutsPaid.length);

  if (!user) return null;
  if (isLoading) return <div className="p-8 text-zinc-400">Cargando tablero...</div>;

  return (
    <div className="p-3 md:p-6 lg:p-8 space-y-4 md:space-y-6 flex-1 overflow-hidden flex flex-col min-h-0 w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center shrink-0 gap-3 md:gap-4">
        <div className="w-full md:w-auto">
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">Tablero Operativo</h1>
          
          {user.role === 'BARBER' ? (
            <p className="text-emerald-400 font-medium text-xs md:text-sm mt-1">Has completado/cobrado {myCompletedCutsToday} cortes el día de hoy.</p>
          ) : (
            <div className="flex items-center gap-2 mt-2">
              <Filter className="w-3 h-3 md:w-4 md:h-4 text-zinc-500" />
              <select 
                value={selectedBarberFilter}
                onChange={e => setSelectedBarberFilter(e.target.value)}
                className="bg-zinc-800 text-[11px] md:text-xs text-white border border-zinc-700 rounded-md px-2 py-1 md:py-1.5 outline-none focus:ring-1 focus:ring-emerald-500 w-full md:w-auto"
              >
                <option value="">Todos los Barberos</option>
                {barbers?.map((b: any) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
        
        <button 
          onClick={() => setCheckinOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 md:px-6 py-2.5 md:py-3 rounded-xl text-sm md:text-base font-medium transition-colors shadow-lg active:scale-95 w-full md:w-auto"
        >
          + Cargar Cliente
        </button>
      </div>

      <div className="flex md:grid md:grid-cols-4 gap-4 flex-1 min-h-0 overflow-x-auto snap-x snap-mandatory hide-scrollbar pb-2 md:pb-0 font-sans">
        <div className="w-[85vw] md:w-auto shrink-0 snap-start md:snap-none h-full">
          <BoardColumn title="ESPERA" count={cutsWaiting.length} cuts={cutsWaiting} color="border-yellow-500/50" />
        </div>
        <div className="w-[85vw] md:w-auto shrink-0 snap-start md:snap-none h-full">
          <BoardColumn title="EN PROCESO" count={cutsInProgress.length} cuts={cutsInProgress} color="border-blue-500/50" />
        </div>
        <div className="w-[85vw] md:w-auto shrink-0 snap-start md:snap-none h-full">
          <BoardColumn title="FINALIZADO" count={cutsFinished.length} cuts={cutsFinished} color="border-orange-500/50" />
        </div>
        <div className="w-[85vw] md:w-auto shrink-0 snap-start md:snap-none h-full pr-4 md:pr-0">
          <BoardColumn title="COBRADO (Hoy)" count={cutsPaid.length} cuts={cutsPaid} color="border-emerald-500/50" hideActions />
        </div>
      </div>

      {isCheckinOpen && (
        <QuickCheckinModal onClose={() => setCheckinOpen(false)} />
      )}
    </div>
  );
}
