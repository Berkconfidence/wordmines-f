import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import GameBoard from '../../components/GameBoard';

export default function Game() {
    const params = useLocalSearchParams();
    const { roomId, opponentId, userId } = params;

    const handleBack = () => {
        router.push('/new-game'); // Yeni oyun sayfasına geri dön
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
                        <Text style={styles.gameInfo}>Oda: {roomId}</Text>
                        <GameBoard roomId={String(roomId)} userId={String(userId)} />
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