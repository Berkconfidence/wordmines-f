import React from "react";
import { View, Text } from 'react-native';
import { Stack } from 'expo-router';

export default function Game() {
    return (
        <>
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text>Game Screen</Text>
            </View>
        </>
    );
}