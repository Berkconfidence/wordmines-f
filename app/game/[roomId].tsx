import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import GameBoard from '../../components/GameBoard';

export default function Game() {
    const params = useLocalSearchParams();
    const { roomId, opponentId, userId, duration } = params;

    // duration'u dakika cinsine çevir
    let durationMinutes: number | undefined = undefined;
    if (duration) {
        const d = Number(duration);
        if (d === 2 || d === 5) durationMinutes = d;
        else if (d === 12 || d === 24) durationMinutes = d * 60;
    }

    const handleBack = () => {
        router.replace('/home'); // Yeni oyun sayfasına geri dön ve bu ekranı stack'ten çıkar
    };

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <SafeAreaView style={styles.container}>
                <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                    <Ionicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.content}>
                        <GameBoard
                            roomId={String(roomId)}
                            userId={String(userId)}
                            duration={durationMinutes}
                        />
                    </View>
                </ScrollView>
            </SafeAreaView>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#eff8ff',
    },
    backButton: {
        position: 'absolute',
        top: 50,
        left: 20,
        padding: 8,
        zIndex: 10,
    },
    scrollContent: {
        flexGrow: 1,
        paddingTop: 80,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 10,
    },
    gameInfo: {
        marginBottom: 10,
        fontSize: 14,
    },
});