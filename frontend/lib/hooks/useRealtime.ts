// src/hooks/useRealtime.ts - frontend sse hook
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export function useRealtime(url: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Si la API es http://localhost:3001/events
    const eventSource = new EventSource(url);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('SSE Event:', data);

        // Si el evento afecta al board o envia actualizaciones a todos
        if (
          data.type === 'CUT_CREATED' ||
          data.type === 'CUT_UPDATED' ||
          data.type === 'PAYMENT_CREATED' ||
          data.type === 'BOARD_REFRESH'
        ) {
          // Forzar refresh de TanStack query con clave de board para repintar
          queryClient.invalidateQueries({ queryKey: ['board-cuts'] });
        }
      } catch (err) {
        console.error('Failed to parse SSE event:', err);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE Error:', error);
      eventSource.close(); // opcional, o re-conectar
    };

    return () => {
      eventSource.close();
    };
  }, [url, queryClient]);
}
