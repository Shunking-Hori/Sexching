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
import { AdminInquiriesScreen } from './AdminInquiriesScreen';
import { EditProfileScreen } from './EditProfileScreen';
import { ChatScreen } from './ChatScreen';
import { LegalScreen } from './LegalScreen';
import { InquiryScreen } from './InquiryScreen';
import type { User } from '../../App';
import { supabase } from '../lib/supabase';

type Tab = 'home' | 'likes' | 'matches' | 'mypage' | 'admin';
type AdminMode = 'likes' | 'inquiries';

type Props = {
  onLogout: () => void;
};

export function MainTabScreen({ onLogout }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [adminMode, setAdminMode] = useState<AdminMode>('likes');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isOpeningInquiry, setIsOpeningInquiry] = useState(false);
  const [matchesRefreshKey, setMatchesRefreshKey] = useState(0);
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
        onBack={() => setSelectedUser(null)}
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

  if (isOpeningInquiry) {
    return <InquiryScreen onBack={() => setIsOpeningInquiry(false)} />;
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

  const renderAdminScreen = () => (
    <View style={styles.adminWrapper}>
      <View style={styles.adminSwitchRow}>
        <TouchableOpacity
          style={[styles.adminSwitchButton, adminMode === 'likes' && styles.adminSwitchButtonActive]}
          onPress={() => setAdminMode('likes')}
        >
          <Text style={[styles.adminSwitchText, adminMode === 'likes' && styles.adminSwitchTextActive]}>
            いいね承認
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.adminSwitchButton, adminMode === 'inquiries' && styles.adminSwitchButtonActive]}
          onPress={() => setAdminMode('inquiries')}
        >
          <Text style={[styles.adminSwitchText, adminMode === 'inquiries' && styles.adminSwitchTextActive]}>
            お問い合わせ
          </Text>
        </TouchableOpacity>
      </View>
      <View style={styles.adminContent}>
        {adminMode === 'likes' ? <AdminLikesScreen /> : <AdminInquiriesScreen />}
      </View>
    </View>
  );

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

    if (activeTab === 'admin') return renderAdminScreen();

    if (activeTab === 'mypage') {
      return (
        <MyPageScreen
          onLogout={onLogout}
          onEdit={() => setIsEditingProfile(true)}
          onOpenLegal={setLegalType}
          onOpenInquiry={() => setIsOpeningInquiry(true)}
        />
      );
    }

    return <MatchListScreen onSelectUser={setSelectedUser} />;
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
  },
  adminWrapper: {
    flex: 1,
    backgroundColor: colors.background,
  },
  adminSwitchRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    width: '100%',
    maxWidth: 680,
    alignSelf: 'center',
  },
  adminSwitchButton: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: 'center',
    paddingVertical: 12,
  },
  adminSwitchButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  adminSwitchText: {
    color: colors.subText,
    fontSize: 13,
    fontWeight: '900',
  },
  adminSwitchTextActive: {
    color: '#fff',
  },
  adminContent: {
    flex: 1,
  },
  tabBar: {
    height: 74,
    backgroundColor: colors.card,
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
