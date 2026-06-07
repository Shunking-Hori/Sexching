import React, { useState } from 'react';
import { HomeScreen } from './src/screens/HomeScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { MainTabScreen } from './src/screens/MainTabScreen';
import { AuthScreen } from './src/screens/AuthScreen';
import { LegalScreen } from './src/screens/LegalScreen';
import { supabase } from './src/lib/supabase';

type Screen = 'home' | 'auth' | 'profile' | 'main';
type AuthInitialMode = 'login' | 'signup';
type LegalType = 'terms' | 'privacy' | 'contact';

export type User = {
  id: string;
  name: string;
  age: number;
  gender: string;
  prefecture: string;
  profile: string;
  photoUrl: string | null;
  photoUrls: string[];
  hobbies: string[];
  holiday: string;
  job: string;
  bustSize?: string;
};

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [authLegalType, setAuthLegalType] = useState<LegalType | null>(null);
  const [authInitialMode, setAuthInitialMode] = useState<AuthInitialMode>('login');

  const goAfterLogin = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setScreen('auth');
      return;
    }

    const { data } = await supabase
      .from('profiles')
      .select('id, is_banned')
      .eq('id', user.id)
      .maybeSingle();

    if (data?.is_banned) {
      alert('このアカウントは利用停止中です。');
      await supabase.auth.signOut();
      setScreen('home');
      return;
    }

    setScreen(data ? 'main' : 'profile');
  };

  if (authLegalType) {
    return <LegalScreen type={authLegalType} onBack={() => setAuthLegalType(null)} />;
  }

  if (screen === 'auth') {
    return (
      <AuthScreen
        initialMode={authInitialMode}
        onComplete={goAfterLogin}
        onOpenLegal={setAuthLegalType}
      />
    );
  }

  if (screen === 'profile') {
    return <ProfileScreen onComplete={() => setScreen('main')} />;
  }

  if (screen === 'main') {
    return <MainTabScreen onLogout={() => setScreen('home')} />;
  }

  return (
    <HomeScreen
      onLogin={() => {
        setAuthInitialMode('login');
        setScreen('auth');
      }}
      onSignup={() => {
        setAuthInitialMode('signup');
        setScreen('auth');
      }}
    />
  );
}
