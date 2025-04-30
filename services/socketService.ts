import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { API_WSURL } from '@/config';

const socketUrl = API_WSURL;
let stompClient: Client | null = null;

// WebSocket bağlantısını oluşturan yardımcı fonksiyon
const createStompClient = () => {
  if (stompClient) return stompClient;
  
  const socket = new SockJS(socketUrl);
  stompClient = new Client({
    webSocketFactory: () => socket,
    onStompError: err => console.log('WebSocket Hatası', err),
  });
  
  return stompClient;
};

// Eşleştirme işlemini başlatan fonksiyon
export const startMatchmaking = (userId: string, duration: number, 
  onUpdate?: (update: any) => void, 
  onMatch?: (data: any) => void, 
  onError?: (error: any) => void) => {
  
  const client = createStompClient();
  
  client.onConnect = () => {
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
      //console.log("Eşleşme bulundu:", data);
      
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
  };

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
      stompClient = null;
    }
  };
};

// Oyun odasına katılma fonksiyonu
export const joinRoom = (roomId: string) => {
  const client = createStompClient();
  
  if (!client.connected) {
    client.onConnect = () => {
      client.publish({
        destination: '/app/join-room',
        body: JSON.stringify({ roomId }),
      });
      console.log(`${roomId} odasına katılındı`);
    };
    
    client.activate();
  } else {
    client.publish({
      destination: '/app/join-room',
      body: JSON.stringify({ roomId }),
    });
    console.log(`${roomId} odasına katılındı`);
  }
};

// Hamle gönderme fonksiyonu
export const sendMove = (roomId: string, position: { row: number, col: number }, letter: string) => {
  const client = createStompClient();
  
  if (client.connected) {
    client.publish({
      destination: '/app/move',
      body: JSON.stringify({ roomId, position, letter }),
    });
    console.log(`Hamle gönderildi: ${letter} - (${position.row},${position.col})`);
  } else {
    console.error('WebSocket bağlantısı kurulamadı');
  }
};

// Hamleleri dinleme fonksiyonu
export const listenForMoves = (onMove: (move: any) => void) => {
  const client = createStompClient();
  
  if (!client.connected) {
    client.activate();
  }
  
  const subscription = client.subscribe('/topic/moves', (message) => {
    const move = JSON.parse(message.body);
    console.log('Hamle alındı:', move);
    onMove(move);
  });
  
  return () => {
    subscription.unsubscribe();
  };
};

// Geriye dönük uyumluluk için useMatchmakingSocket hook'unu tutalım
export const useMatchmakingSocket = (userId: string, duration: number) => {
  console.warn('useMatchmakingSocket hook kullanımı artık önerilmiyor. startMatchmaking fonksiyonunu kullanın');
  return null; // Boş dönüş
};

