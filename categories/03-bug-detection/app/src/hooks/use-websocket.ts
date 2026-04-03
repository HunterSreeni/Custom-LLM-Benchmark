import { useState, useEffect, useRef } from 'react';

interface PriceUpdate {
  productId: string;
  newPrice: number;
  timestamp: number;
}

interface UseWebSocketResult {
  priceUpdates: Map<string, number>;
  isConnected: boolean;
  lastUpdate: number | null;
}

export function useWebSocket(url: string): UseWebSocketResult {
  const [priceUpdates, setPriceUpdates] = useState<Map<string, number>>(
    new Map()
  );
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<number | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      console.log('WebSocket connected for price updates');
    };

    ws.onmessage = (event) => {
      try {
        const update: PriceUpdate = JSON.parse(event.data);
        setPriceUpdates((prev) => {
          const next = new Map(prev);
          next.set(update.productId, update.newPrice);
          return next;
        });
        setLastUpdate(update.timestamp);
      } catch (err) {
        console.error('Failed to parse price update:', err);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };

    ws.onclose = () => {
      setIsConnected(false);
      console.log('WebSocket disconnected');
    };

    return () => {
      wsRef.current = null;
    };
  }, [url]);

  return { priceUpdates, isConnected, lastUpdate };
}
