import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { API_WSURL } from '@/config';

const socketUrl = API_WSURL; // IP ile değiştir

// Eşleştirme işlemini başlatan fonksiyon
export const startMatchmaking = (userId: string, duration: number, 
  onUpdate?: (update: any) => void, 
  onMatch?: (data: any) => void, 
  onError?: (error: any) => void) => {
  
  const socket = new SockJS(socketUrl);
  const client = new Client({
    webSocketFactory: () => socket,
    onConnect: () => {
      console.log('WebSocket bağlantısı kuruldu.');

      // Eşleşme güncellemelerini dinle
      client.subscribe('/topic/matchmaking-update', message => {
        const update = JSON.parse(message.body);
        console.log('Güncelleme:', update);
        if (onUpdate) onUpdate(update);
      });

      // Eşleşme sonucu
      client.subscribe('/user/queue/game-matched', message => {
        const data = JSON.parse(message.body);
        console.log("Eşleşme bulundu:", data);
        if (onMatch) onMatch(data);
      });

      // Hatalar
      client.subscribe(`/user/queue/matchmaking-error`, message => {
        const error = JSON.parse(message.body);
        console.log('Eşleşme hatası:', error);
        if (onError) onError(error);
      });

      // Kuyruğa giriş gönder
      client.publish({
        destination: '/app/find-match',
        body: JSON.stringify({ userId, duration }),
      });
    },
    onStompError: err => console.log('WebSocket Hatası', err),
  });

  client.activate();

  // Eşleştirmeyi iptal etmek için kullanılacak fonksiyonu döndür
  return {
    cancelMatchmaking: () => {
      if (client.connected) {
        client.publish({
          destination: '/app/cancel-matchmaking',
          body: JSON.stringify({ userId }),
        });
      }
      client.deactivate();
    }
  };
};

// Geriye dönük uyumluluk için useMatchmakingSocket hook'unu tutalım
// Bu eski bir yaklaşım, yeni yaklaşımda startMatchmaking kullanılmalı
export const useMatchmakingSocket = (userId: string, duration: number) => {
  console.warn('useMatchmakingSocket hook kullanımı artık önerilmiyor. startMatchmaking fonksiyonunu kullanın');
  return null; // Boş dönüş
};
