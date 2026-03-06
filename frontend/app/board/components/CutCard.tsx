"use client";

import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Play, CheckCircle, DollarSign, Clock, AlertTriangle } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface CutCardProps {
  cut: any;
  hideActions?: boolean;
}

export default function CutCard({ cut, hideActions }: CutCardProps) {
  const queryClient = useQueryClient();

  // Mutation Optimizada
  const updateCutStatus = useMutation({
    mutationFn: async ({ id, action, payload }: { id: string, action: string, payload?: any }) => {
      const url = `${API_URL}/cuts/${id}/${action}`;
      return axios.post(url, payload || {});
    },
    // Optimistic Update para ser "ultra rápido" incluso con red lenta
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board-cuts'] });
    }
  });

  const formatearDinero = (val: number) => 
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val);

  const formatHora = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="bg-zinc-800 p-3 md:p-4 rounded-xl border border-zinc-700/50 hover:border-zinc-600 transition-colors shadow-sm group flex flex-col">
      <div className="flex justify-between items-start mb-1 md:mb-2">
        <h3 className="font-semibold text-zinc-100 text-sm md:text-base truncate pr-2">{cut.client?.full_name}</h3>
        {cut.status === 'SIN_COBRO' && (
          <span className="text-[10px] bg-red-950 text-red-400 px-2 py-0.5 rounded-full flex items-center gap-1 font-medium border border-red-900/50">
            <AlertTriangle className="w-3 h-3" />
            +2hs
          </span>
        )}
      </div>
      
      <div className="space-y-1 mb-3 md:mb-4">
        <p className="text-[11px] md:text-xs text-zinc-400 flex items-center justify-between">
          <span className="truncate pr-2">{cut.service?.name}</span>
          <span className="font-mono text-zinc-300 whitespace-nowrap">{formatearDinero(cut.price_snapshot)}</span>
        </p>
        <p className="text-[11px] md:text-xs text-zinc-500 truncate">Barbero: {cut.barber?.name}</p>
        
        <div className="flex items-center gap-1 md:gap-2 text-[9px] md:text-[10px] text-zinc-500 mt-1 md:mt-2">
          <Clock className="w-3 h-3 flex-shrink-0" />
          <span>Ingreso: {formatHora(cut.created_at)}</span>
        </div>
      </div>

      {!hideActions && (
        <div className="mt-3 pt-2 md:pt-3 border-t border-zinc-700/50 flex justify-end">
          {cut.status === 'WAITING' && (
            <button 
              onClick={() => updateCutStatus.mutate({ id: cut.id, action: 'start' })}
              disabled={updateCutStatus.isPending}
              className="w-full bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-colors flex items-center justify-center gap-1 md:gap-2 active:bg-blue-600/40"
            >
              <Play className="w-3.5 h-3.5 md:w-4 md:h-4" /> Iniciar
            </button>
          )}

          {cut.status === 'IN_PROGRESS' && (
            <button 
              onClick={() => updateCutStatus.mutate({ id: cut.id, action: 'finish' })}
              disabled={updateCutStatus.isPending}
              className="w-full bg-orange-600/20 hover:bg-orange-600/30 text-orange-400 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-colors flex items-center justify-center gap-1 md:gap-2 active:bg-orange-600/40"
            >
              <CheckCircle className="w-3.5 h-3.5 md:w-4 md:h-4" /> Finalizar
            </button>
          )}

          {(cut.status === 'FINISHED' || cut.status === 'SIN_COBRO') && (
             <button 
             onClick={() => {
               // Demo: por defecto efectivo asumiendo el precio. Esto puede abrir un modal
               updateCutStatus.mutate({ 
                 id: cut.id, 
                 action: 'pay', 
                 payload: { method: 'CASH' } // Simplificado para "Pago rápido 1 click"
               });
             }}
             disabled={updateCutStatus.isPending}
             className="w-full bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-colors flex items-center justify-center gap-1 md:gap-2 active:bg-emerald-600/40"
           >
             <DollarSign className="w-3.5 h-3.5 md:w-4 md:h-4" /> Cobrar Total
           </button>
          )}
        </div>
      )}
    </div>
  );
}
