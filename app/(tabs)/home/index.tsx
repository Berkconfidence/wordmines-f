import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Image, StatusBar } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { router } from 'expo-router';
import { Colors } from '../../../constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';

export default function Home() {

    const [winRatio, setWinRatio] = React.useState(0.75);

    const routerNewGame = () => {
        router.push('/new-game');
    };

    const routerActiveGames = () => {
        //@ts-ignore
        router.push('/(tabs)/active-games');
    };

    const routerFinishedGames = () => {
        //@ts-ignore
        router.push('/(tabs)/finished-games');
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
                <View style={styles.infoCard}>
                    <Animated.View 
                        entering={FadeInUp.duration(1000).springify()}
                    >
                        <View style={styles.infoHeader}>
                            <Text style={styles.textName}>berkconfidence</Text>
                            <View>
                                <Text style={styles.text}>Başarı Yüzdesi: %{Math.round(winRatio * 100)}</Text>
                                <View style={styles.progressContainer}>
                                    <View style={[styles.progressBar, { width: `${winRatio * 100}%` }]} />
                                </View>
                            </View>
                        </View>
                    </Animated.View>
                </View>

                <TouchableOpacity 
                 style={styles.gameCard}
                 onPress={() => routerNewGame()}
                >
                    <LinearGradient
                        colors={['#a654f7', '#855cf3', '#6a63f3']}
                        start={{x: 0, y: 0}}
                        end={{x: 1, y: 0}}
                        style={{flex: 1, borderRadius: 14}}
                    >
                        <Animated.View 
                            entering={FadeInUp.duration(1000).springify()}
                        >
                            <View style={styles.gameHeader}>
                                <View style={{...styles.iconHeader, backgroundColor: '#af79f8'}}>
                                    <Image
                                        source={require('../../../assets/images/controllericon.png')}
                                        style={{ width: 30, height: 30 }}
                                    />
                                </View>
                                <Text style={styles.gameText}>Yeni Oyun</Text>
                            </View>
                        </Animated.View>
                    </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={styles.gameCard}
                    onPress={() => routerActiveGames()}
                >
                    <LinearGradient
                        colors={['#3a83f6', '#229ce5', '#06b6d5']}
                        start={{x: 0, y: 0}}
                        end={{x: 1, y: 0}}
                        style={{flex: 1, borderRadius: 14}}
                    >
                        <Animated.View 
                            entering={FadeInUp.duration(1000).springify()}
                        >
                            <View style={styles.gameHeader}>
                                <View style={{...styles.iconHeader, backgroundColor: '#57a5f1'}}>
                                    <Image
                                        source={require('../../../assets/images/personicon.png')}
                                        style={{ width: 30, height: 30 }}
                                    />
                                </View>
                                <Text style={styles.gameText}>Aktif Oyunlar</Text>
                            </View>
                        </Animated.View>
                    </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={styles.gameCard}
                    onPress={() => routerFinishedGames()}
                >
                    <LinearGradient
                        colors={['#f59c0a', '#f7850f', '#f97316']}
                        start={{x: 0, y: 0}}
                        end={{x: 1, y: 0}}
                        style={{flex: 1, borderRadius: 14}}
                    >
                        <Animated.View 
                            entering={FadeInUp.duration(1000).springify()}
                        >
                            <View style={styles.gameHeader}>
                                <View style={{...styles.iconHeader, backgroundColor: '#f6ad3d'}}>
                                    <Image
                                        source={require('../../../assets/images/trophyicon.png')}
                                        style={{ width: 30, height: 30 }}
                                    />
                                </View>
                                <Text style={styles.gameText}>Biten Oyunlar</Text>
                            </View>
                        </Animated.View>
                    </LinearGradient>
                </TouchableOpacity>
                
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
    infoCard: {
        height: 85,
        marginTop: 50,
        marginBottom: 100,
        justifyContent: 'center',
        padding: 15,
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
    infoHeader: {
        flexDirection: 'row',
        justifyContent: "space-between",
        alignItems: 'center',
    },
    textName: {
        fontSize: 15,
        fontWeight: 'bold',
        color: Colors.light.text,
    },
    text: {
        fontSize: 14,
        fontWeight: 600,
        color: Colors.light.text,
    },
    progressContainer: {
        width: 130,
        height: 8,
        backgroundColor: '#e0e0e0',
        borderRadius: 4,
        marginTop: 4,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        backgroundColor: Colors.light.tint || '#2f95dc',
        borderRadius: 4,
    },

    gameCard: {
        height: 85,
        justifyContent: 'center',
        borderRadius: 14,
        marginVertical: 10,
        marginHorizontal: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 5, // Android için gölge
        overflow: 'hidden',
    },
    gameHeader: {
        marginTop: 12,
        flexDirection: 'row',
        alignItems: 'center',
    },
    gameText: {
        fontSize: 25,
        fontWeight: 'bold',
        marginLeft: 10,
        color: '#fff',
    },
    iconHeader: {
        height: 60,
        width: 60,
        justifyContent: 'center',
        padding: 15,
        borderRadius: 12,
        marginHorizontal: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 5, // Android için gölge
        overflow: 'hidden',
    },
});