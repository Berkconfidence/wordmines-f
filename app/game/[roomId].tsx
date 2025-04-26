import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
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
            <View style={styles.container}>
                <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                    <Ionicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                
                <View style={styles.content}>
                    <Text>Game ID: {roomId}, Opponent ID: {opponentId}, User ID: {userId}</Text>
            
                    <GameBoard />
                </View>
            </View>
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
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
});