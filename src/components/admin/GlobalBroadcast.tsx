import React, { useState, useEffect } from 'react';

interface BroadcastMessage {
  id: string;
  content: string;
  type: 'info' | 'warning' | 'emergency';
}

/**
 * BroadcastSystem listens for real-time announcements from the admin panel
 * and displays them immediately to all connected users.
 */
export const GlobalBroadcast: React.FC = () => {
  const [message, setMessage] = useState<BroadcastMessage | null>(null);

  // In a real implementation, subscribe to your WebSocket/Realtime provider here
  useEffect(() => {
    // Example: supabase.channel('broadcast').on('broadcast', { event: 'alert' }, (payload) => setMessage(payload))
  }, []);

  if (!message) return null;

  const bgColors = {
    info: 'bg-blue-600',
    warning: 'bg-amber-500',
    emergency: 'bg-red-700',
  };

  return (
    <div className={`fixed top-0 left-0 w-full z-50 p-3 text-center text-white font-bold shadow-lg animate-pulse ${bgColors[message.type]}`}>
      <span>{message.content}</span>
      <button onClick={() => setMessage(null)} className="ml-4 underline text-sm opacity-80 hover:opacity-100">Dismiss</button>
    </div>
  );
};