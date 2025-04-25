import React from "react";
import { View, Text , TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Image, StatusBar } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function ActiveGames() {

    const handleBack = () => {
        router.back(); // Önceki sayfaya dönüş
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
                    <TouchableOpacity style={styles.gameCard}>
                        <Animated.View 
                            entering={FadeInUp.duration(1000).springify()}
                        >
                            <View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2}}>
                                <Text style={styles.opponentName}>berkconfidence</Text>
                                <Text style={styles.scoreTable}>42 - 38</Text>                             
                            </View>
                            <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                                <Text style={styles.gameTime}>24 Saat</Text>
                                <View style={{flexDirection: 'row'}}>
                                    <Text style={styles.moveOrderMine}>Sizin Sıranız</Text>
                                    <Image
                                        source={require('../../../assets/images/persontickicon.png')}
                                        style={{ width: 20, height: 20, marginRight: 15 }}
                                    />
                                </View>
                            </View>
                            <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                                <Text style={styles.remainingTimeLabel}>Kalan süre:</Text>
                                <Text style={styles.remainingTime}>1 saat 23 dk</Text>
                            </View>                        
                        </Animated.View>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.gameCard}>
                        <Animated.View 
                            entering={FadeInUp.duration(1000).springify()}
                        >
                            <View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2}}>
                                <Text style={styles.opponentName}>berkconfidence</Text>
                                <Text style={styles.scoreTable}>42 - 38</Text>                             
                            </View>
                            <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                                <Text style={styles.gameTime}>24 Saat</Text>
                                <View style={{flexDirection: 'row'}}>
                                    <Text style={styles.moveOrderOpponent}>Sizin Sıranız</Text>
                                    <Image
                                        source={require('../../../assets/images/clockred.png')}
                                        style={{ width: 20, height: 20, marginRight: 15 }}
                                    />
                                </View>
                            </View>
                            <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                                <Text style={styles.remainingTimeLabel}>Kalan süre:</Text>
                                <Text style={styles.remainingTime}>1 saat 23 dk</Text>
                            </View>                        
                        </Animated.View>
                    </TouchableOpacity>
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