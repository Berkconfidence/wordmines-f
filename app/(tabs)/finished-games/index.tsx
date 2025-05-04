import React, { useEffect, useState } from "react";
import { View, Text , TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Image, StatusBar, ActivityIndicator } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '@/config';

export default function FinishedGames() {
    const [userId, setUserId] = useState<string | null>(null);
    const [games, setGames] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [scoresMap, setScoresMap] = useState<{ [roomId: string]: any[] }>({}); // roomId -> scores array

    useEffect(() => {
        AsyncStorage.getItem('userId').then(id => {
            setUserId(id);
        });
    }, []);

    useEffect(() => {
        if (!userId) return;
        setLoading(true);
        fetch(`${API_URL}/gameroom/finished?userId=${userId}`)
            .then(res => res.json())
            .then(data => {
                setGames(Array.isArray(data) ? data : []);
            })
            .catch(() => setGames([]))
            .finally(() => setLoading(false));
    }, [userId]);

    // Her oyun için skorları çek
    useEffect(() => {
        if (!games.length) return;
        const fetchScores = async () => {
            const newScoresMap: { [roomId: string]: any[] } = {};
            await Promise.all(
                games.map(async (game) => {
                    try {
                        const res = await fetch(`${API_URL}/gameroom/scores?roomId=${game.roomId}`);
                        const data = await res.json();
                        if (Array.isArray(data)) {
                            newScoresMap[game.roomId] = data;
                        }
                    } catch {}
                })
            );
            setScoresMap(newScoresMap);
        };
        fetchScores();
    }, [games]);

    const handleBack = () => {
        router.back();
    };

    // Rakip adı: skorlar üzerinden userId'den farklı olan oyuncunun username'i
    const getOpponentName = (game: any) => {
        const scores = scoresMap[game.roomId];
        if (!scores || !userId) return "";
        const opponent = scores.find((p: any) => String(p.userId) !== String(userId));
        return opponent ? opponent.username : "";
    };

    // Skorlar (renkli)
    const getScoreRow = (game: any) => {
        const scores = scoresMap[game.roomId];
        if (!scores || !userId) return "";
        const user = scores.find((p: any) => String(p.userId) === String(userId));
        const opponent = scores.find((p: any) => String(p.userId) !== String(userId));
        if (!user || !opponent) return "";
        const userColor = user.score > opponent.score ? styles.scoreGreen : user.score < opponent.score ? styles.scoreRed : styles.scoreGray;
        const opponentColor = opponent.score > user.score ? styles.scoreGreen : opponent.score < user.score ? styles.scoreRed : styles.scoreGray;
        return (
            <Text style={styles.scoreTable}>
                <Text style={userColor}>{user.score}</Text>
                {" - "}
                <Text style={opponentColor}>{opponent.score}</Text>
            </Text>
        );
    };

    // Kazanma/Kaybetme
    const getResult = (game: any) => {
        if (!userId) return { text: "", win: false };
        if (String(game.winnerId) === String(userId)) return { text: "Kazandınız", win: true };
        return { text: "Kaybettiniz", win: false };
    };

    // Süreyi okunabilir yap
    const formatDuration = (duration: string | number) => {
        if (!duration) return "-";
        if (duration === "24" || duration === "24h") return "24 Saat";
        if (duration === "12" || duration === "12h") return "12 Saat";
        if (duration === "2" || duration === "2m") return "2 Dakika";
        if (duration === "5" || duration === "5m") return "5 Dakika";
        if (typeof duration === "string" && duration.endsWith("m")) return `${duration.replace("m", "")} Dakika`;
        if (typeof duration === "string" && duration.endsWith("h")) return `${duration.replace("h", "")} Saat`;
        return duration;
    };

    // Tarihi okunabilir yap
    const formatDate = (dateStr: string) => {
        if (!dateStr) return "";
        const d = new Date(dateStr);
        return d.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
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
                    <Text style={styles.containerText}>Biten Oyunlar</Text>
                </View>

                <View>
                    {loading && (
                        <ActivityIndicator size="large" color="#3498db" style={{ marginTop: 40 }} />
                    )}
                    {!loading && games.length === 0 && (
                        <Text style={{ textAlign: 'center', marginTop: 40, color: '#888' }}>
                            Biten oyununuz yok.
                        </Text>
                    )}
                    {!loading && games.map((game, idx) => {
                        const opponentName = getOpponentName(game);
                        const scoreRow = getScoreRow(game);
                        const result = getResult(game);
                        return (
                            <TouchableOpacity style={styles.gameCard} key={game.roomId || idx}>
                                <Animated.View entering={FadeInUp.duration(1000).springify()}>
                                    <View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2}}>
                                        <Text style={styles.opponentName}>{opponentName}</Text>
                                        {scoreRow}
                                    </View>
                                    <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                                        <Text style={styles.gameTime}>{formatDuration(game.gameDuration)}</Text>
                                        <View style={{flexDirection: 'row'}}>
                                            <Image
                                                source={result.win
                                                    ? require('../../../assets/images/tickicon.png')
                                                    : require('../../../assets/images/cancelicon.png')}
                                                style={result.win
                                                    ? { width: 14, height: 16, marginRight: 7, marginTop: 2 }
                                                    : { width: 16, height: 16, marginRight: 5, marginTop: 2.5 }}
                                            />
                                            <Text style={result.win ? styles.winnerSide : styles.loserSide}>{result.text}</Text>
                                        </View>
                                    </View>
                                    <View style={{alignItems: 'flex-end'}}>
                                        <Text style={styles.matchDate}>{formatDate(game.finishedAt)}</Text>
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
    winnerSide: {
        paddingRight: 15,
        fontSize: 14,
        color: '#16a34a',
    },
    loserSide: {
        paddingRight: 15,
        fontSize: 14,
        color: '#dc2626',
    },
    matchDate: {
        paddingRight: 15,
        paddingTop: 15,
        fontSize: 16,
        fontWeight: 'bold',
    },
    scoreGreen: {
        color: '#16a34a',
        fontWeight: 'bold',
    },
    scoreRed: {
        color: '#dc2626',
        fontWeight: 'bold',
    },
    scoreGray: {
        color: '#71717a',
        fontWeight: 'bold',
    },
});