import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Image, StatusBar } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Colors } from '../../../constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function NewGame() {

    const handleBack = () => {
        router.push('/home'); // Önceki sayfaya dönüş
    };

    const handleGameStart = (duration: string) => {
        router.push(`/new-game/waiting?duration=${duration}`);
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
                    <Text style={styles.containerText}>Yeni Oyun</Text>
                </View>

                <View>
                    <Animated.View 
                        entering={FadeInUp.duration(1000).springify()}
                    >
                        <View style={styles.fastHeader}>
                            <Image
                                source={require('../../../assets/images/flashicon.png')}
                                style={{ width: 30, height: 30 }}
                            />
                            <Text style={styles.fastText}>Hızlı Oyun</Text>
                        </View>
                    </Animated.View>
                    <TouchableOpacity 
                        style={styles.gameCard}
                        onPress={() => handleGameStart('2')} 
                    >                           
                        <LinearGradient
                            colors={['#fbbd21', '#fa9a1d', '#f97617']}
                            start={{x: 0, y: 0}}
                            end={{x: 1, y: 0}}
                            style={{flex: 1, borderRadius: 14}}
                        >
                            <Animated.View 
                                entering={FadeInUp.duration(1000).springify()}
                            >
                                <Text style={styles.gameTitle}>2 Dakika</Text>
                                <Text style={styles.gameSubtitle}>
                                    Kullanıcılar, 2 dakika içinde kelimeyi yazmalıdır. Yazmazsa oyunu kaybeder.
                                </Text>
                            </Animated.View>
                        </LinearGradient>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={styles.gameCard}
                        onPress={() => handleGameStart('5')}
                    >
                        <LinearGradient
                            colors={['#fc8f3b', '#f46e41', '#ef4544']}
                            start={{x: 0, y: 0}}
                            end={{x: 1, y: 0}}
                            style={{flex: 1, borderRadius: 14}}
                        >
                            <Animated.View 
                                entering={FadeInUp.duration(1000).springify()}
                            >
                                <Text style={styles.gameTitle}>5 Dakika</Text>
                                <Text style={styles.gameSubtitle}>
                                    Kullanıcılar, 5 dakika içinde kelimeyi yazmalıdır. Yazmazsa oyunu kaybeder.
                                </Text>
                            </Animated.View>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>

                <View>
                    <Animated.View 
                        entering={FadeInUp.duration(1000).springify()}
                    >
                        <View style={styles.fastHeader}>
                            <Image
                                source={require('../../../assets/images/clockicon.png')}
                                style={{ width: 30, height: 30 }}
                            />
                            <Text style={styles.fastText}>Genişletilmiş Oyun</Text>
                        </View>
                    </Animated.View>
                    <TouchableOpacity 
                        style={styles.gameCard}
                        onPress={() => handleGameStart('12')}
                    >
                        <LinearGradient
                            colors={['#60a2fb', '#6485f8', '#6466f0']}
                            start={{x: 0, y: 0}}
                            end={{x: 1, y: 0}}
                            style={{flex: 1, borderRadius: 14}}
                        >
                            <Animated.View 
                                entering={FadeInUp.duration(1000).springify()}
                            >
                                <Text style={styles.gameTitle}>12 Saat</Text>
                                <Text style={styles.gameSubtitle}>
                                    Kullanıcılar, 12 saat içinde kelimeyi yazmalıdır. Yazmazsa oyunu kaybeder.
                                </Text>
                            </Animated.View>
                        </LinearGradient>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={styles.gameCard}
                        onPress={() => handleGameStart('24')}
                    >
                        <LinearGradient
                            colors={['#828cf8', '#9371f7', '#a758f7']}
                            start={{x: 0, y: 0}}
                            end={{x: 1, y: 0}}
                            style={{flex: 1, borderRadius: 14}}
                        >
                            <Animated.View 
                                entering={FadeInUp.duration(1000).springify()}
                            >
                                <Text style={styles.gameTitle}>24 Saat</Text>
                                <Text style={styles.gameSubtitle}>
                                    Kullanıcılar, 24 saat içinde kelimeyi yazmalıdır. Yazmazsa oyunu kaybeder.
                                </Text>
                            </Animated.View>
                        </LinearGradient>
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

    fastHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 20,
        marginLeft: 20,
        marginBottom: 10,
    },
    fastText: {
        fontSize: 20,
        fontWeight: 'bold',
        marginLeft: 10,
        color: Colors.light.text,
    },
    gameCard: {
        height: 90,
        justifyContent: 'center',
        borderRadius: 14,
        marginVertical: 7,
        marginHorizontal: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 5, // Android için gölge
        overflow: 'hidden',
    },
    gameTitle: {
        paddingLeft: 5,
        paddingTop: 10,
        fontSize: 20,
        fontWeight: 'bold',
        marginLeft: 10,
        color: '#fff',
    },
    gameSubtitle: {
        paddingLeft: 5,
        paddingTop: 2,
        fontSize: 15,
        marginLeft: 10,
        color: '#fff',
    },
});