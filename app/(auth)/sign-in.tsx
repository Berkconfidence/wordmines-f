import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Modal } from 'react-native';
import React, { useState } from 'react';
import { Link, router } from 'expo-router';
import { Colors } from '../../constants/Colors';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { API_URL } from '../../config';


export default function SignIn() {

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
    const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
    const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
    const [forgotPasswordError, setForgotPasswordError] = useState('');

    const handleSignIn = async () => {
      if (isLoading) return;

      if(username === '' || password === '') {
        setError('Lütfen tüm alanları doldurun');
        return;
      }
      
      try {
        const response = await fetch(`${API_URL}/user/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json', // JSON olduğunu belirtiyoruz
          },
          body: JSON.stringify({ // Objeyi JSON'a çeviriyoruz
            username: username,
            password: password
          }),
        });
        if(response.ok) {
          router.push('../(tabs)/index');
        }
        else {
          setError('Kullanıcı adı veya şifre hatalı');
        }

      }
      catch (error) {
        setError('Bir hata oluştu. Lütfen tekrar deneyin.');
      }

    };
    
    const handleForgotPassword = async () => {
        
    };

    return (
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.formContainer}>
              <Animated.View 
                entering={FadeInDown.duration(1000).springify()}
                style={styles.headerContainer}
              >
                <Text style={styles.title}>Kelime Mayınları'na</Text>
                <Text style={styles.title}>Hoş Geldiniz</Text>
                <Text style={styles.subtitle}>Eğlenceli yolculuğunuza devam edin</Text>
              </Animated.View>
              
              <Animated.View 
                entering={FadeInUp.duration(1000).springify()}
                style={styles.inputContainer}
              >
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={[styles.input, error && styles.inputError]}
                    placeholder="Kullanıcı Adı Giriniz"
                    value={username}
                    onChangeText={(text) => {
                      setUsername(text);
                      setError('');
                    }}
                    autoCapitalize="none"
                  />
                  <TextInput
                    style={[styles.input, error && styles.inputError]}
                    placeholder="Şifre"
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      setError('');
                    }}
                    secureTextEntry
                  />
                  {error ? (
                    <Animated.Text 
                      entering={FadeInUp.duration(500).springify()}
                      style={styles.errorText}
                    >
                      {error}
                    </Animated.Text>
                  ) : null}
                </View>
    
                <TouchableOpacity 
                  style={[styles.signInButton, isLoading && styles.signInButtonDisabled]} 
                  onPress={handleSignIn}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.signInButtonText}>Giriş Yap</Text>
                  )}
                </TouchableOpacity>
    
                <TouchableOpacity 
                  style={styles.forgotPassword} 
                  onPress={() => setShowForgotPasswordModal(true)}
                >
                  <Text style={styles.forgotPasswordText}>Şifremi Unuttum</Text>
                </TouchableOpacity>
    
                <View style={styles.signUpContainer}>
                  <Text style={styles.signUpText}>Hesabınız yok mu? </Text>
                  <Link href="/sign-up" asChild>
                    <TouchableOpacity>
                      <Text style={styles.signUpLink}>Kayıt Ol</Text>
                    </TouchableOpacity>
                  </Link>
                </View>
              </Animated.View>
            </View>
          </ScrollView>
    
          <Modal
            visible={showForgotPasswordModal}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setShowForgotPasswordModal(false)}
          >
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.modalContainer}
            >
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Şifremi Unuttum</Text>
                  <TouchableOpacity 
                    onPress={() => {
                      setShowForgotPasswordModal(false);
                      setForgotPasswordEmail('');
                      setForgotPasswordError('');
                    }}
                  >
                    <Ionicons name="close" size={24} color="#999999" />
                  </TouchableOpacity>
                </View>
    
                <Text style={styles.modalDescription}>
                  Şifrenizi sıfırlamak için e-posta adresinizi girin. Size şifre sıfırlama bağlantısı göndereceğiz.
                </Text>
    
                <TextInput
                  style={styles.input}
                  placeholder="E-posta adresiniz"
                  value={forgotPasswordEmail}
                  onChangeText={(text) => {
                    setForgotPasswordEmail(text);
                    setForgotPasswordError('');
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
    
                {forgotPasswordError ? (
                  <Text style={styles.errorText}>{forgotPasswordError}</Text>
                ) : null}
    
                <TouchableOpacity
                  style={[styles.button, forgotPasswordLoading && styles.buttonDisabled]}
                  onPress={handleForgotPassword}
                  disabled={forgotPasswordLoading}
                >
                  {forgotPasswordLoading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.buttonText}>Şifre Sıfırlama Bağlantısı Gönder</Text>
                  )}
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </Modal>
        </KeyboardAvoidingView>
      );
    }
    
    const styles = StyleSheet.create({
      container: {
        flex: 1,
        backgroundColor: '#fff',
      },
      scrollContent: {
        flexGrow: 1,
      },
      formContainer: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 24,
        paddingTop: 40,
      },
      headerContainer: {
        marginBottom: 40,
      },
      title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: Colors.light.primary,
        textAlign: 'center',
      },
      subtitle: {
        fontSize: 16,
        color: Colors.light.text,
        textAlign: 'center',
        marginTop: 8,
      },
      inputContainer: {
        width: '100%',
        maxWidth: 400,
        alignSelf: 'center',
      },
      inputWrapper: {
        gap: 16,
        marginBottom: 24,
      },
      input: {
        width: '100%',
        height: 50,
        borderWidth: 1,
        borderColor: Colors.light.text,
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 16,
        backgroundColor: '#F7F7F7',
      },
      inputError: {
        borderColor: '#ff3b30',
        backgroundColor: '#fff5f5',
      },
      errorText: {
        color: '#ff3b30',
        fontSize: 14,
        marginTop: 8,
        paddingHorizontal: 4,
      },
      signInButton: {
        width: '100%',
        height: 50,
        backgroundColor: Colors.light.primary,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: Colors.light.primary,
        shadowOffset: {
          width: 0,
          height: 4,
        },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
      },
      signInButtonDisabled: {
        opacity: 0.7,
      },
      signInButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
      },
      forgotPassword: {
        alignSelf: 'flex-end',
        marginTop: 16,
        padding: 8,
      },
      forgotPasswordText: {
        color: Colors.light.primary,
        fontSize: 14,
        fontWeight: '500',
      },
      signUpContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 24,
      },
      signUpText: {
        color: Colors.light.text,
        fontSize: 15,
      },
      signUpLink: {
        color: Colors.light.primary,
        fontSize: 15,
        fontWeight: '600',
      },
      modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        padding: 20,
      },
      modalContent: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 20,
        width: '100%',
        maxWidth: 400,
      },
      modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
      },
      modalTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#000000',
      },
      modalDescription: {
        fontSize: 14,
        color: '#666666',
        marginBottom: 20,
        lineHeight: 20,
      },
      button: {
        width: '100%',
        height: 50,
        backgroundColor: Colors.light.primary,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: Colors.light.primary,
        shadowOffset: {
          width: 0,
          height: 4,
        },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
        marginTop: 5,
      },
      buttonDisabled: {
        backgroundColor: '#999999',
      },
      buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
      },
    });
    