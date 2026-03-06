"use client";

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Search, X } from 'lucide-react';
import { useAuthStore } from '../../../lib/store/useAuthStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function QuickCheckinModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [selectedService, setSelectedService] = useState('');
  // Si es ADMIN, escoge autocompletándose él mismo por defecto. Si es BARBER se autocompleta también.
  const [selectedBarber, setSelectedBarber] = useState(user?.id || '');

  // Búsqueda real de Clientes
  const { data: searchResults } = useQuery({
    queryKey: ['client-search', phone],
    queryFn: async () => {
      if (phone.length < 3) return null;
      const res = await axios.get(`${API_URL}/clients/search?q=${phone}`);
      return res.data;
    },
    enabled: phone.length >= 3,
  });

  // Cargar servicios reales
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

  const checkinMutation = useMutation({
    mutationFn: async () => {
      let clientId = searchResults?.[0]?.id;
      // Si no existe, lo creamos
      if (!clientId) {
        const clientRes = await axios.post(`${API_URL}/clients`, { phone, fullName: name || 'Invitado' });
        clientId = clientRes.data.id;
      }
      
      const forcedService = selectedService || services?.[0]?.id;
      
      return axios.post(`${API_URL}/cuts/checkin`, {
        clientId,
        serviceId: forcedService, 
        barberId: selectedBarber || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board-cuts'] });
      onClose();
    }
  });

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl p-6 relative">
        <button onClick={onClose} className="absolute right-4 top-4 text-zinc-500 hover:text-zinc-300">
          <X className="w-5 h-5" />
        </button>
        
        <h2 className="text-xl font-bold text-white mb-6">Nuevo Turno (Check-in)</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">Teléfono / Cliente</label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-zinc-500" />
              <input 
                type="text" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg py-2 pl-10 pr-4 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                placeholder="Ej: 1122334455"
              />
            </div>
            {/* Sugerencias en UI en linea */}
            {searchResults && searchResults.length > 0 && (
              <div className="mt-2 text-sm text-emerald-400 font-medium">
                Encontrado: {searchResults[0].full_name}
              </div>
            )}
          </div>

          {!searchResults?.length && phone.length > 3 && (
             <div>
             <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">Nombre (Nuevo Cliente)</label>
             <input 
               type="text" 
               value={name}
               onChange={(e) => setName(e.target.value)}
               className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg py-2 px-4 focus:ring-2 focus:ring-emerald-500 outline-none"
               placeholder="Nombre completo"
             />
           </div>
          )}

          <div>
             <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">Servicio</label>
             <select 
               value={selectedService}
               onChange={(e) => setSelectedService(e.target.value)}
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
              value={selectedBarber}
              onChange={(e) => setSelectedBarber(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg py-2 px-4 focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              <option value="">Cualquiera</option>
              {barbers?.map((b: any) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          <div className="pt-4 mt-4 border-t border-zinc-800 flex justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:text-white transition-colors">
              Cancelar
            </button>
            <button
              onClick={() => checkinMutation.mutate()}
              disabled={checkinMutation.isPending || !phone}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              Confirmar Ingreso
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
