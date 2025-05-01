import React, { useEffect, useState } from "react";
import { View, Text , TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Image, StatusBar, ActivityIndicator } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '@/config';


export default function ActiveGames() {
    // Kullanıcı id'sini alın (örnek olarak sabit)
    const [userId, setUserId] = useState<string | null>(null);
    const [games, setGames] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchGames = async () => {
            if (!userId) {
                setGames([]); // userId yoksa boş dizi ata
                setLoading(false);
                return;
            }
            try {
                const res = await fetch(`${API_URL}/gameroom/active?userId=${userId}`);
                const data = await res.json();
                setGames(Array.isArray(data) ? data : []); // Her durumda dizi ata
            } catch (e) {
                setGames([]);
            } finally {
                setLoading(false);
            }
        };
        fetchGames();
    }, [userId]);

    useEffect(() => {
        // AsyncStorage'dan userId'yi al
        AsyncStorage.getItem('userId').then(id => {
          setUserId(id);
        });
      }, []);

    const handleBack = () => {
        router.push('/home');
    };

    // Oyun kartına tıklanınca ilgili oyun ekranına git
    const handleGamePress = (roomId: number, opponentId: number) => {
        router.push({
            pathname: "/game/[roomId]",
            params: { 
                roomId: roomId,
                opponentId: opponentId,
                userId: userId
            },
        });
    };

    // Rakip id ve adını bul
    const getOpponentId = (game: any) => {
        return String(game.player1Id) === String(userId) ? game.player2Id : game.player1Id;
    };
    const getOpponentName = (game: any) => {
        // Eğer backend'den username gelmiyorsa, sadece id göster
        return String(game.player1Id) === String(userId) ? `Oyuncu ${game.player2Id}` : `Oyuncu ${game.player1Id}`;
    };

    // Oyun süresini okunabilir hale getir
    const formatDuration = (duration: string) => {
        if (duration === "24h") return "24 Saat";
        if (duration === "12h") return "12 Saat";
        if (duration && duration.endsWith("m")) return `${duration.replace("m", "")} Dakika`;
        return duration || "-";
    };

    // Sıra kimde kontrolü
    const getMoveOrder = (game: any) => {
        if (String(game.currentTurn) === String(userId)) {
            return { text: "Sizin Sıranız", mine: true };
        }
        return { text: "Rakipte", mine: false };
    };

    return (
        <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
            <StatusBar backgroundColor="#eff8ff" barStyle="dark-content" />
            <ScrollView 
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.infoContainer}>
                    <TouchableOpacity 
                        onPress={handleBack} 
                        style={styles.backButton}
                    >
                        <Ionicons name="arrow-back" size={23} color='black' />
                    </TouchableOpacity>
                    <Text style={styles.containerText}>Aktif Oyunlar</Text>
                </View>

                <View>
                    {loading && (
                        <ActivityIndicator size="large" color="#3498db" style={{ marginTop: 40 }} />
                    )}
                    {!loading && games.length === 0 && (
                        <Text style={{ textAlign: 'center', marginTop: 40, color: '#888' }}>
                            Aktif oyununuz yok.
                        </Text>
                    )}
                    {!loading && games.map((game, idx) => {
                        const opponentName = getOpponentName(game);
                        const moveOrder = getMoveOrder(game);
                        const score = 
                            String(game.player1Id) === String(userId)
                                ? `${game.player1Score} - ${game.player2Score}`
                                : `${game.player2Score} - ${game.player1Score}`;
                        const opponentId = getOpponentId(game);
                        return (
                            <TouchableOpacity
                                key={game.roomId || idx}
                                style={styles.gameCard}
                                onPress={() => handleGamePress(game.roomId, opponentId)}
                            >
                                <Animated.View entering={FadeInUp.duration(1000).springify()}>
                                    <View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2}}>
                                        <Text style={styles.opponentName}>{opponentName}</Text>
                                        <Text style={styles.scoreTable}>{score}</Text>
                                    </View>
                                    <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                                        <Text style={styles.gameTime}>{formatDuration(game.gameDuration)}</Text>
                                        <View style={{flexDirection: 'row'}}>
                                            <Text style={moveOrder.mine ? styles.moveOrderMine : styles.moveOrderOpponent}>
                                                {moveOrder.text}
                                            </Text>
                                            <Image
                                                source={moveOrder.mine
                                                    ? require('../../../assets/images/persontickicon.png')
                                                    : require('../../../assets/images/clockred.png')}
                                                style={{ width: 20, height: 20, marginRight: 15 }}
                                            />
                                        </View>
                                    </View>
                                    <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                                        <Text style={styles.remainingTimeLabel}>Oda ID:</Text>
                                        <Text style={styles.remainingTime}>
                                            {game.roomId}
                                        </Text>
                                    </View>
                                </Animated.View>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#eff8ff',
    },
    scrollContent: {
        flexGrow: 1,
    },
    infoContainer: {
        flexDirection: 'row',
        marginTop: 50,
        padding: 15,
    },
    backButton: {
        padding: 8,
        marginRight: 4,
    },
    containerText: {
        fontSize: 25,
        fontWeight: 'bold',
        marginLeft: 10,
    },

    gameCard: {
        height: 105,
        backgroundColor: '#fff',
        borderRadius: 12,
        marginVertical: 10,
        marginHorizontal: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 5, // Android için gölge
        overflow: 'hidden',
    },
    opponentName: {
        paddingLeft: 15,
        paddingTop: 10,
        fontSize: 20,
        fontWeight: 'bold',
    },
    gameTime: {
        paddingLeft: 15,
        fontSize: 14,
        color: '#71717a',
    },
    scoreTable: {
        paddingRight: 15,
        paddingTop: 10,
        fontSize: 20,
        fontWeight: 'bold',
    },
    moveOrderMine: {
        paddingRight: 5,
        fontSize: 14,
        color: '#16a34a',
    },
    moveOrderOpponent: {
        paddingRight: 5,
        fontSize: 14,
        color: '#dc2626',
    },
    remainingTimeLabel: {
        paddingLeft: 15,
        paddingTop: 15,
        fontSize: 14,
        color: '#71717a',
    },
    remainingTime: {
        paddingRight: 15,
        paddingTop: 15,
        fontSize: 16,
        fontWeight: 'bold',
    },
});