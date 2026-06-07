import React from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

type Props = {
  onLogin: () => void;
  onSignup: () => void;
};

export function HomeScreen({ onLogin, onSignup }: Props) {
  return (
    <SafeAreaView style={styles.homeContainer}>
      <View style={styles.heroCard}>
        <Text style={styles.logo}>Xching</Text>

        <Text style={styles.catchcopy}>
          少し大人なあなたに
        </Text>

        <Text style={styles.description}>
          気取らず、でも心地よく
        </Text>

        <TouchableOpacity style={styles.primaryButton} onPress={onSignup}>
          <Text style={styles.primaryButtonText}>新規登録</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={onLogin}>
          <Text style={styles.secondaryButtonText}>ログイン</Text>
        </TouchableOpacity>
      </View>

      <StatusBar style="dark" />
    </SafeAreaView>
  );
}

const colors = {
  background: '#fff7f5',
  card: '#ffffff',
  primary: '#8f2d56',
  primaryDark: '#6f1f41',
  text: '#2b2226',
  subText: '#75666c',
  border: '#ead9de',
};

const styles = StyleSheet.create({
  homeContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    padding: 24,
  },
  heroCard: {
    backgroundColor: colors.card,
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    borderRadius: 28,
    paddingVertical: 44,
    paddingHorizontal: 26,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
  },
  logo: {
    fontSize: 44,
    fontWeight: '800',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 18,
  },
  catchcopy: {
    fontSize: 27,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    lineHeight: 36,
    marginBottom: 18,
  },
  description: {
    fontSize: 15,
    color: colors.subText,
    textAlign: 'center',
    lineHeight: 25,
    marginBottom: 36,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 18,
    paddingVertical: 17,
    alignItems: 'center',
    marginTop: 28,
    shadowColor: colors.primaryDark,
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 3,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
    backgroundColor: '#fff',
  },
  secondaryButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '800',
  },
});
