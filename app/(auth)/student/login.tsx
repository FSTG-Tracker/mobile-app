import { Feather, FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator, Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput, TouchableOpacity,
  View
} from 'react-native';
import { useAppTheme } from '../../../theme';

export default function StudentLogin() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loginError, setLoginError] = useState('');

  const [isLoading, setIsLoading] = useState(false);

  const validate = () => {
    let isValid = true;
    setEmailError('');
    setPasswordError('');
    setLoginError('');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError('L\'email est requis');
      isValid = false;
    } else if (!emailRegex.test(email)) {
      setEmailError('Format d\'email invalide');
      isValid = false;
    }

    if (!password) {
      setPasswordError('Le mot de passe est requis');
      isValid = false;
    } else if (password.length < 8) {
      setPasswordError('Le mot de passe doit contenir au moins 8 caractères');
      isValid = false;
    }

    return isValid;
  };

  // ── Identifiants de test ──────────────────────────────────────────
  // Email : etudiant@fst.ma | Mot de passe : 12345678
  const MOCK_STUDENT = {
    email: 'etudiant@fst.ma',
    password: '12345678',
    user: {
      id: '1',
      nom: 'El Amrani',
      prenom: 'Mohamed',
      email: 'etudiant@fst.ma',
      filiere: 'SMI - S6',
      groupe: 'Groupe A',
      apogee: '2100456',
    },
  };

  const handleLogin = async () => {
    if (!validate()) return;

    setIsLoading(true);

    // Simuler un délai réseau
    await new Promise((r) => setTimeout(r, 800));

    if (email === MOCK_STUDENT.email && password === MOCK_STUDENT.password) {
      await AsyncStorage.setItem('token', 'mock-student-token-xyz');
      await AsyncStorage.setItem('user', JSON.stringify(MOCK_STUDENT.user));
      await AsyncStorage.setItem('role', 'student');

      setIsLoading(false);
      router.replace('/(student)/schedule');
    } else {
      setLoginError('Email ou mot de passe incorrect');
      setIsLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={[styles.scrollContainer, { backgroundColor: colors.background }]}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Feather name="arrow-left" size={24} color={colors.foreground} />
      </TouchableOpacity>

      <Text style={[styles.pageType, { color: colors.mutedForeground }]}>Connexion Étudiant</Text>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, shadowColor: colors.foreground === '#ffffff' ? '#000' : colors.foreground }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground }]}>Ravi de vous revoir</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Connectez-vous à votre compte FSTracker
          </Text>
        </View>

        {loginError ? (
          <View style={[styles.errorBox, { backgroundColor: colors.destructive + '15' }]}>
            <Text style={[styles.mainErrorText, { color: colors.destructive }]}>{loginError}</Text>
          </View>
        ) : null}

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.foreground }]}>Email académique</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.background,
                borderColor: emailError ? colors.destructive : colors.border,
                color: colors.foreground
              }
            ]}
            placeholder="m@uca.ac.ma"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
          {emailError ? <Text style={[styles.errorText, { color: colors.destructive }]}>{emailError}</Text> : null}
        </View>

        <View style={styles.inputGroup}>
          <View style={styles.passwordHeader}>
            <Text style={[styles.label, { color: colors.foreground }]}>Mot de passe</Text>
            <TouchableOpacity>
              <Text style={[styles.forgotPassword, { color: colors.primary }]}>Mot de passe oublié ?</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.passwordInputContainer}>
            <TextInput
              style={[
                styles.input,
                styles.passwordInput,
                {
                  backgroundColor: colors.background,
                  borderColor: passwordError ? colors.destructive : colors.border,
                  color: colors.foreground
                }
              ]}
              placeholder="••••••••"
              placeholderTextColor={colors.mutedForeground}
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Feather name={showPassword ? "eye-off" : "eye"} size={20} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
          {passwordError ? <Text style={[styles.errorText, { color: colors.destructive }]}>{passwordError}</Text> : null}
        </View>

        <TouchableOpacity
          style={[styles.loginButton, { backgroundColor: colors.primary }]}
          onPress={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.loginButtonText}>Se connecter</Text>
          )}
        </TouchableOpacity>

        <View style={styles.separatorContainer}>
          <View style={[styles.separatorLine, { backgroundColor: colors.border }]} />
          <Text style={[styles.separatorText, { color: colors.mutedForeground, backgroundColor: colors.card }]}>Ou</Text>
          <View style={[styles.separatorLine, { backgroundColor: colors.border }]} />
        </View>

        <TouchableOpacity
          style={[styles.googleButton, { borderColor: colors.border }]}
        >
          <FontAwesome5 name="google" size={18} color={colors.foreground} style={styles.googleIcon} />
          <Text style={[styles.googleButtonText, { color: colors.foreground }]}>Continuer avec Google</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={{ color: colors.mutedForeground }}>Vous n'avez pas de compte ? </Text>
        <TouchableOpacity>
          <Text style={{ color: colors.primary, fontWeight: '600' }}>Contacter Support</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
    paddingTop: Platform.OS === 'ios' ? 80 : 60,
    paddingBottom: 40,
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 20,
    zIndex: 10,
    padding: 8,
  },
  pageType: {
    textAlign: 'center',
    marginBottom: 24,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  card: {
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 4,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
  errorBox: {
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
    alignItems: 'center',
  },
  mainErrorText: {
    fontSize: 14,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  passwordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  forgotPassword: {
    fontSize: 13,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 50,
    fontSize: 15,
  },
  passwordInputContainer: {
    position: 'relative',
    justifyContent: 'center',
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeIcon: {
    position: 'absolute',
    right: 14,
    padding: 4,
  },
  errorText: {
    fontSize: 12,
    marginTop: 6,
    fontWeight: '500',
  },
  loginButton: {
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  separatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  separatorLine: {
    flex: 1,
    height: 1,
  },
  separatorText: {
    paddingHorizontal: 16,
    fontSize: 13,
    fontWeight: '500',
  },
  googleButton: {
    flexDirection: 'row',
    height: 50,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  googleIcon: {
    marginRight: 10,
  },
  googleButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32,
  },
});
