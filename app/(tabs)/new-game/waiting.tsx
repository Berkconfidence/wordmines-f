import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, StatusBar } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../constants/Colors';
import { startMatchmaking } from '../../../services/socketService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function WaitingScreen() {
  const params = useLocalSearchParams();
  const duration = params.duration as string;
  
  const [userId, setUserId] = useState<string | null>(null);
  const [waitingTime, setWaitingTime] = useState(0);
  const [queueInfo, setQueueInfo] = useState({ queueLength: 0, estimatedTime: 0 });
  const [error, setError] = useState<string | null>(null);
  
  // Socket bağlantısı referansını saklayacak ref
  const socketRef = useRef<{ cancelMatchmaking: () => void } | null>(null);
  
  useEffect(() => {
    // AsyncStorage'dan userId'yi al
    AsyncStorage.getItem('userId').then(id => {
      setUserId(id);
    });
  }, []);

  // Socket bağlantısını başlat ve temizle
  useEffect(() => {
    if (userId) {
      // Socket bağlantısını başlat
      socketRef.current = startMatchmaking(
        userId,
        Number(duration),
        (update) => {
          
        },
        (matchData) => {
          router.push({
            pathname: "/game/[roomId]",
            params: { roomId: matchData.roomId, opponentId: matchData.opponentId, userId: userId },
          });
        },
        (err) => {
          setError(err.message || "Bir hata oluştu");
        }
      );

      router.push({
        pathname: "/game/[roomId]",
        params: { roomId: 1923, opponentId: 5, userId: 1 },
      });
      
      // Temizleme fonksiyonu
      return () => {
        if (socketRef.current) {
          socketRef.current.cancelMatchmaking();
          socketRef.current = null;
        }
      };
    }
  }, [userId, duration]);

  // Animasyon için değişkenler
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);
  
  // Dönen animasyon stili
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { rotate: `${rotation.value}deg` },
        { scale: scale.value }
      ],
    };
  });

  useEffect(() => {
    // Başlangıç animasyonları
    rotation.value = withRepeat(
      withTiming(360, { duration: 3000, easing: Easing.linear }),
      -1, // Sonsuz tekrar
      false
    );
    
    scale.value = withRepeat(
      withTiming(1.2, { duration: 1500, easing: Easing.ease }),
      -1, // Sonsuz tekrar
      true  // reverse
    );
    
    // Zamanlayıcı
    const timer = setInterval(() => {
      setWaitingTime(prev => prev + 1);
    }, 1000);
    
    // Temizleme işlemi
    return () => {
      clearInterval(timer);
    };
  }, []);
  
  const cancelMatchmaking = () => {
    // Socket bağlantısını kapat
    if (socketRef.current) {
      socketRef.current.cancelMatchmaking();
    }
    router.back();
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#eff8ff" barStyle="dark-content" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={cancelMatchmaking} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rakip Aranıyor</Text>
      </View>
      
      {!userId ? (
        <ActivityIndicator size="large" color={Colors.light.primary} />
      ) : (
        <View style={styles.content}>
          <Animated.View style={[styles.animationContainer, animatedStyle]}>
            <ActivityIndicator size="large" color={Colors.light.primary} />
          </Animated.View>
          
          <Text style={styles.durationText}>
            {duration === '2' ? '2 Dakika' : 
             duration === '5' ? '5 Dakika' : 
             duration === '12' ? '12 Saat' : '24 Saat'} Oyun
          </Text>
          
          <Text style={styles.waitingText}>
            Bekleme süresi: {formatTime(waitingTime)}
          </Text>
          
          {queueInfo.queueLength > 0 && (
            <Text style={styles.queueText}>
              Sırada {queueInfo.queueLength} kişi bekliyor
            </Text>
          )}
          
          {queueInfo.estimatedTime > 0 && (
            <Text style={styles.estimatedText}>
              Tahmini eşleşme süresi: ~{queueInfo.estimatedTime} saniye
            </Text>
          )}
          
          {error && (
            <Text style={styles.errorText}>{error}</Text>
          )}
          
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={cancelMatchmaking}
          >
            <Text style={styles.cancelButtonText}>Aramayı İptal Et</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eff8ff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginLeft: 15,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  animationContainer: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 50,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    marginBottom: 30,
  },
  durationText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: Colors.light.primary,
  },
  waitingText: {
    fontSize: 18,
    marginBottom: 30,
  },
  queueText: {
    fontSize: 16,
    marginBottom: 8,
  },
  estimatedText: {
    fontSize: 16,
    marginBottom: 30,
    color: Colors.light.secondary,
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    marginBottom: 20,
    textAlign: 'center',
  },
  cancelButton: {
    backgroundColor: '#e11d48',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});