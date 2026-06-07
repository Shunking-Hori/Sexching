import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { MatchListScreen } from './MatchListScreen';
import { LikesScreen } from './LikesScreen';
import { MatchesScreen } from './MatchesScreen';
import { MyPageScreen } from './MyPageScreen';
import { ProfileDetailScreen } from './ProfileDetailScreen';
import { AdminLikesScreen } from './AdminLikesScreen';
import { EditProfileScreen } from './EditProfileScreen';
import { ChatScreen } from './ChatScreen';
import type { User } from '../../App';
import { supabase } from '../lib/supabase';
import { LegalScreen } from './LegalScreen';

type Tab = 'home' | 'likes' | 'matches' | 'mypage' | 'admin';

type Props = {
  onLogout: () => void;
};

export function MainTabScreen({ onLogout }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [matchesRefreshKey, setMatchesRefreshKey] = useState(0);
  const [matchListRefreshKey, setMatchListRefreshKey] = useState(0);
  const [legalType, setLegalType] = useState<'terms' | 'privacy' | 'contact' | null>(null);
  const [chatPartner, setChatPartner] = useState<{
    id: string;
    name: string;
  } | null>(null);

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setIsAdmin(false);
      return;
    }

    const { data } = await supabase
      .from('admins')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    setIsAdmin(Boolean(data));
  };

  const closeChat = () => {
    setChatPartner(null);
    setMatchesRefreshKey((current) => current + 1);
    setActiveTab('matches');
  };

  if (selectedUser) {
    return (
      <ProfileDetailScreen
        user={selectedUser}
        onBack={(refresh) => {
          setSelectedUser(null);
          if (refresh) {
            setMatchListRefreshKey((current) => current + 1);
          }
        }}
      />
    );
  }

  if (isEditingProfile) {
    return (
      <EditProfileScreen
        onBack={() => setIsEditingProfile(false)}
        onSaved={() => setIsEditingProfile(false)}
      />
    );
  }


  if (legalType) {
  return (
    <LegalScreen
      type={legalType}
      onBack={() => setLegalType(null)}
    />
  );
}
  if (chatPartner) {
    return (
      <ChatScreen
        partnerId={chatPartner.id}
        partnerName={chatPartner.name}
        onBack={closeChat}
      />
    );
  }

  const renderScreen = () => {
    if (activeTab === 'likes') return <LikesScreen />;

    if (activeTab === 'matches') {
      return (
        <MatchesScreen
          key={matchesRefreshKey}
          onOpenChat={(partnerId, partnerName) =>
            setChatPartner({ id: partnerId, name: partnerName })
          }
        />
      );
    }

    if (activeTab === 'admin') return <AdminLikesScreen />;

    if (activeTab === 'mypage') {
      return (
        <MyPageScreen
          onLogout={onLogout}
          onEdit={() => setIsEditingProfile(true)}
          onOpenLegal={setLegalType}
        />
      );
    }

    return (
      <MatchListScreen
        key={matchListRefreshKey}
        onSelectUser={setSelectedUser}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.screenArea}>{renderScreen()}</View>

      <View style={styles.tabBar}>
        <TabButton
          label="ホーム"
          icon="🏠"
          active={activeTab === 'home'}
          onPress={() => setActiveTab('home')}
        />

        <TabButton
          label="いいね"
          icon="♡"
          active={activeTab === 'likes'}
          onPress={() => setActiveTab('likes')}
        />

        <TabButton
          label="マッチ"
          icon="💬"
          active={activeTab === 'matches'}
          onPress={() => setActiveTab('matches')}
        />

        {isAdmin && (
          <TabButton
            label="管理"
            icon="🛡️"
            active={activeTab === 'admin'}
            onPress={() => setActiveTab('admin')}
          />
        )}

        <TabButton
          label="マイページ"
          icon="👤"
          active={activeTab === 'mypage'}
          onPress={() => setActiveTab('mypage')}
        />
      </View>
    </SafeAreaView>
  );
}

type TabButtonProps = {
  label: string;
  icon: string;
  active: boolean;
  onPress: () => void;
};

function TabButton({ label, icon, active, onPress }: TabButtonProps) {
  return (
    <TouchableOpacity style={styles.tabButton} onPress={onPress}>
      <Text style={[styles.tabIcon, active && styles.tabTextActive]}>
        {icon}
      </Text>
      <Text style={[styles.tabText, active && styles.tabTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const colors = {
  background: '#fff7f5',
  card: '#ffffff',
  primary: '#8f2d56',
  subText: '#75666c',
  border: '#ead9de',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  screenArea: {
    flex: 1,
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
  },
  tabBar: {
    height: 74,
    backgroundColor: colors.card,
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: 'row',
    paddingTop: 8,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
  },
  tabIcon: {
    fontSize: 19,
    color: colors.subText,
  },
  tabText: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: '700',
    color: colors.subText,
  },
  tabTextActive: {
    color: colors.primary,
  },
});