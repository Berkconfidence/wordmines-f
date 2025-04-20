import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Keyboard } from 'react-native';
import React, { useState } from 'react';
import { Link, router } from 'expo-router';
import { Colors } from '../../constants/Colors';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
import { API_URL } from '../../config';

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSignUp = async () => {
    if (isLoading) return;
    
    if (password !== confirmPassword) {
      setError('Şifreler eşleşmiyor');
      return;
    }
    if (!email || !username || !password) {
      setError('Lütfen tüm alanları doldurun');
      return;
    }

    // Şifre validasyonu
    if (password.length < 6) {
      setError('Şifre en az 6 karakter olmalıdır');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Geçerli bir e-posta adresi girin');
      return;
    }

    // Username validation (only letters, numbers, and underscores)
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(username)) {
      setError('Kullanıcı adı sadece harf, rakam ve alt çizgi içerebilir');
      return;
    }

    console.log('Kayıt işlemi başlatılıyor...');
    const formdata = new FormData();
      formdata.append('username', username);
      formdata.append('email', email);
      formdata.append('password', password);
      try {
        const response = await fetch(`${API_URL}/user/signup`, {
          method: 'POST',
          headers: {
            "Content-Type": "multipart/form-data",
          },
          body: formdata,
        });
        if(response.ok) {
          const data = await response.json();
          if (data.success) {
            router.push('/sign-in');
          } else {
            setError(data.message || 'Kayıt işlemi başarısız oldu');
            console.log('Kayıt işlemi başarısız oldu:1');
          }
        }
        else {
          setError('Kayıt işlemi başarısız oldu. Lütfen tekrar deneyin.');
          console.log('Kayıt işlemi başarısız oldu:2');
        }
      }
      catch (error) {
        setError('Bir hata oluştu. Lütfen tekrar deneyin.');
        console.log('Kayıt işlemi başarısız oldu:3');
      } finally {
        setIsLoading(false);
      }

  };

  const navigateToSignIn = () => {
    router.push('/sign-in');
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
        bounces={false}
      >
        <View style={styles.contentContainer}>
          <Animated.View entering={FadeInDown.duration(1000).springify()}>
            <Text style={styles.welcomeText}>Kelime Mayınların'a</Text>
            <Text style={styles.welcomeText}>Hoş Geldiniz</Text>
            <Text style={styles.title}>Kayıt Ol</Text>
          </Animated.View>
          
          {error ? (
            <Animated.Text 
              entering={FadeInUp.duration(500).springify()} 
              style={styles.errorText}
            >
              {error}
            </Animated.Text>
          ) : null}

          <Animated.View 
            entering={FadeInUp.duration(1000).springify()} 
            style={styles.inputContainer}
          >
            <TextInput
              style={styles.input}
              placeholder="Kullanıcı Adı"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />
            <TextInput
              style={styles.input}
              placeholder="E-posta"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TextInput
              style={styles.input}
              placeholder="Şifre"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            <TextInput
              style={styles.input}
              placeholder="Şifre Tekrar"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />
          </Animated.View>

          <Animated.View entering={FadeInUp.duration(1000).delay(200).springify()}>
            <TouchableOpacity 
              style={[styles.button, isLoading && styles.buttonDisabled]} 
              onPress={handleSignUp}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Kayıt Ol</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.linkContainer}
              onPress={navigateToSignIn}
            >
              <Text style={styles.linkText}>Zaten hesabın var mı? </Text>
              <Text style={styles.link}>Giriş Yap</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </ScrollView>
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
    paddingBottom: 40,
  },
  contentContainer: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    marginTop: 40,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.light.primary,
    textAlign: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: Colors.light.primary,
    textAlign: 'center',
    marginBottom: 32,
    marginTop: 8,
  },
  inputContainer: {
    gap: 16,
    marginBottom: 24,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  input: {
    backgroundColor: '#f8f8f8',
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#eee',
  },
  button: {
    backgroundColor: Colors.light.primary,
    padding: 16,
    borderRadius: 12,
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
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: '#ff3b30',
    textAlign: 'center',
    marginBottom: 16,
    backgroundColor: '#fff5f5',
    padding: 12,
    borderRadius: 8,
    overflow: 'hidden',
  },
  linkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
    padding: 8,
  },
  linkText: {
    color: Colors.light.secondary,
    fontSize: 15,
  },
  link: {
    color: Colors.light.primary,
    fontSize: 15,
    fontWeight: '600',
  },
});
