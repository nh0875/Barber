"use client";

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Pickaxe, X } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface EditCutModalProps {
  cut: any;
  onClose: () => void;
}

const STATUS_OPTIONS = [
  { value: 'WAITING', label: 'En Espera' },
  { value: 'IN_PROGRESS', label: 'En Proceso' },
  { value: 'FINISHED', label: 'Finalizado' },
  { value: 'PAID', label: 'Cobrado' },
  { value: 'SIN_COBRO', label: 'Sin Cobro (Vencido)' },
  { value: 'CANCELLED', label: 'Cancelado' }
];

export default function EditCutModal({ cut, onClose }: EditCutModalProps) {
  const queryClient = useQueryClient();
  
  const [status, setStatus] = useState(cut.status || 'WAITING');
  const [barber, setBarber] = useState(cut.barber_id || '');
  const [service, setService] = useState(cut.service_id || '');

  // Cargar servicios
  const { data: services } = useQuery({
    queryKey: ['services-list'],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/services`);
      return res.data;
    }
  });

  // Cargar barberos
  const { data: barbers } = useQuery({
    queryKey: ['barbers-list-modal'],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/barbers`);
      return res.data;
    }
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      return axios.patch(`${API_URL}/cuts/${cut.id}`, {
        status,
        barberId: barber || undefined,
        serviceId: service
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board-cuts'] });
      onClose();
    }
  });

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 font-sans">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-sm shadow-2xl p-6 relative">
        <button onClick={onClose} className="absolute right-4 top-4 text-zinc-500 hover:text-zinc-300">
          <X className="w-5 h-5" />
        </button>
        
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <Pickaxe className="w-5 h-5" />
          Editar Corte
        </h2>

        <div className="text-sm font-medium text-emerald-400 mb-4 bg-emerald-400/10 p-3 rounded-lg border border-emerald-400/20">
          Cliente: {cut.client?.full_name}
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">Estado Actual</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg py-2 px-4 focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <p className="text-[10px] text-zinc-500 mt-1">Si cambias desde "Cobrado" a otro estado, el pago se anulará en caja de forma segura.</p>
          </div>

          <div>
             <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">Servicio</label>
             <select
               value={service}
               onChange={(e) => setService(e.target.value)}
               className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg py-2 px-4 focus:ring-2 focus:ring-emerald-500 outline-none"
             >
                <option value="" disabled>Seleccione servicio...</option>
                {services?.map((s: any) => (
                  <option key={s.id} value={s.id}>{s.name} (${s.base_price})</option>
                ))}
             </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">Barbero</label>
            <select
              value={barber}
              onChange={(e) => setBarber(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg py-2 px-4 focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              <option value="">Cualquiera</option>
              {barbers?.map((b: any) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          <div className="pt-4 mt-6 border-t border-zinc-800 flex justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:text-white transition-colors">
              Cancelar
            </button>
            <button
              onClick={() => updateMutation.mutate()}
              disabled={updateMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              Guardar Cambios
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
