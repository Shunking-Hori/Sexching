import React, { useEffect, useMemo, useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  View,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../lib/supabase';
import { prefectures } from '../constants/prefectures';

type Props = {
  onBack: () => void;
  onSaved: () => void;
};

type DropdownType = 'year' | 'month' | 'day' | 'prefecture' | null;

export function EditProfileScreen({ onBack, onSaved }: Props) {
  const [nickname, setNickname] = useState('');
  const [gender, setGender] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [birthMonth, setBirthMonth] = useState('');
  const [birthDay, setBirthDay] = useState('');
  const [prefecture, setPrefecture] = useState('');
  const [profile, setProfile] = useState('');
  const [hobbies, setHobbies] = useState('');
  const [holiday, setHoliday] = useState('');
  const [job, setJob] = useState('');
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [openDropdown, setOpenDropdown] = useState<DropdownType>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const currentYear = new Date().getFullYear();

  const years = useMemo(() => {
    const result: string[] = [];
    for (let year = currentYear; year >= 1900; year--) {
      result.push(String(year));
    }
    return result;
  }, [currentYear]);

  const months = Array.from({ length: 12 }, (_, index) => String(index + 1));

  const days = useMemo(() => {
    if (!birthYear || !birthMonth) {
      return Array.from({ length: 31 }, (_, index) => String(index + 1));
    }

    const lastDay = new Date(Number(birthYear), Number(birthMonth), 0).getDate();
    return Array.from({ length: lastDay }, (_, index) => String(index + 1));
  }, [birthYear, birthMonth]);

  const calculateAge = () => {
    if (!birthYear || !birthMonth || !birthDay) {
      return null;
    }

    const today = new Date();
    const birthday = new Date(
      Number(birthYear),
      Number(birthMonth) - 1,
      Number(birthDay)
    );

    let age = today.getFullYear() - birthday.getFullYear();
    const monthDiff = today.getMonth() - birthday.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthday.getDate())
    ) {
      age -= 1;
    }

    return age;
  };

  const loadProfile = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error || !data) return;

    const existingPhotos =
      data.photo_urls && data.photo_urls.length > 0
        ? data.photo_urls
        : data.photo_url
          ? [data.photo_url]
          : [];

    setNickname(data.nickname || '');
    setGender(data.gender || '');
    setBirthYear(data.birth_year ? String(data.birth_year) : '');
    setBirthMonth(data.birth_month ? String(data.birth_month) : '');
    setBirthDay(data.birth_day ? String(data.birth_day) : '');
    setPrefecture(data.prefecture || '');
    setProfile(data.profile || '');
    setHobbies(data.hobbies || '');
    setHoliday(data.holiday || '');
    setJob(data.job || '');
    setPhotoUrls(existingPhotos);
  };

  const uploadProfilePhoto = async (uri: string, userId: string) => {
    const response = await fetch(uri);
    const blob = await response.blob();

    const filePath = `${userId}/${Date.now()}.jpg`;

    const { error: uploadError } = await supabase.storage
      .from('profile-photos')
      .upload(filePath, blob, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage
      .from('profile-photos')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const pickImage = async () => {
    if (photoUrls.length >= 5) {
      alert('写真は最大5枚まで登録できます。');
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      alert('写真ライブラリへのアクセス許可が必要です。');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert('ログイン情報を取得できませんでした。');
      return;
    }

    try {
      const publicUrl = await uploadProfilePhoto(result.assets[0].uri, user.id);
      setPhotoUrls([...photoUrls, publicUrl]);
      alert('写真をアップロードしました。保存ボタンを押すと反映されます。');
    } catch {
      alert('写真のアップロードに失敗しました。');
    }
  };

  const removePhoto = (targetUrl: string) => {
    setPhotoUrls(photoUrls.filter((url) => url !== targetUrl));
  };

  const saveProfile = async () => {
    const age = calculateAge();

    if (age === null) {
      alert('生年月日を入力してください。');
      return;
    }

    if (age < 18) {
      alert('18歳未満の方は利用できません。');
      return;
    }

    setIsSaving(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert('ログイン情報を取得できませんでした。');
      setIsSaving(false);
      return;
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        nickname,
        gender,
        birth_year: birthYear ? Number(birthYear) : null,
        birth_month: birthMonth ? Number(birthMonth) : null,
        birth_day: birthDay ? Number(birthDay) : null,
        prefecture,
        profile,
        hobbies,
        holiday,
        job,
        photo_url: photoUrls[0] || null,
        photo_urls: photoUrls,
      })
      .eq('id', user.id);

    setIsSaving(false);

    if (error) {
      alert(error.message);
      return;
    }

    alert('プロフィールを更新しました。');
    onSaved();
  };

  const renderDropdown = (
    type: DropdownType,
    label: string,
    value: string,
    options: string[],
    onSelect: (value: string) => void,
    suffix = ''
  ) => {
    const isOpen = openDropdown === type;

    return (
      <View style={styles.dropdownWrapper}>
        <TouchableOpacity
          style={styles.dropdownButton}
          onPress={() => setOpenDropdown(isOpen ? null : type)}
        >
          <Text style={[styles.dropdownText, !value && styles.placeholderText]}>
            {value ? `${value}${suffix}` : label}
          </Text>
          <Text style={styles.dropdownArrow}>{isOpen ? '▲' : '▼'}</Text>
        </TouchableOpacity>

        {isOpen && (
          <ScrollView style={styles.dropdownList} nestedScrollEnabled>
            {options.map((option) => (
              <TouchableOpacity
                key={option}
                style={styles.dropdownItem}
                onPress={() => {
                  onSelect(option);
                  setOpenDropdown(null);
                }}
              >
                <Text style={styles.dropdownItemText}>
                  {option}
                  {suffix}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.formCard}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backText}>← 戻る</Text>
        </TouchableOpacity>

        <Text style={styles.pageTitle}>プロフィール編集</Text>
        <Text style={styles.pageSubTitle}>プロフィール情報を更新できます</Text>

        <Text style={styles.label}>プロフィール写真（最大5枚）</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {photoUrls.map((url, index) => (
            <View key={url} style={styles.photoItem}>
              <Image source={{ uri: url }} style={styles.photoPreview} />

              {index === 0 && (
                <View style={styles.mainPhotoBadge}>
                  <Text style={styles.mainPhotoBadgeText}>メイン</Text>
                </View>
              )}

              <TouchableOpacity
                style={styles.removePhotoButton}
                onPress={() => removePhoto(url)}
              >
                <Text style={styles.removePhotoText}>×</Text>
              </TouchableOpacity>
            </View>
          ))}

          {photoUrls.length < 5 && (
            <TouchableOpacity style={styles.addPhotoButton} onPress={pickImage}>
              <Text style={styles.addPhotoIcon}>＋</Text>
              <Text style={styles.addPhotoText}>写真追加</Text>
            </TouchableOpacity>
          )}
        </ScrollView>

        <Text style={styles.photoNote}>
          1枚目の写真が一覧画面・プロフィール上部に表示されます。
        </Text>

        <Text style={styles.label}>ニックネーム</Text>
        <TextInput
          style={styles.input}
          value={nickname}
          onChangeText={setNickname}
          placeholder="例：Shun"
        />

        <Text style={styles.label}>性別</Text>
        <View style={styles.choiceRow}>
          {['男性', '女性'].map((item) => (
            <TouchableOpacity
              key={item}
              style={[
                styles.choiceButton,
                gender === item && styles.choiceButtonActive,
              ]}
              onPress={() => setGender(item)}
            >
              <Text
                style={[
                  styles.choiceText,
                  gender === item && styles.choiceTextActive,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>生年月日</Text>
        <View style={styles.birthdayRow}>
          {renderDropdown('year', '年', birthYear, years, setBirthYear, '年')}
          {renderDropdown('month', '月', birthMonth, months, setBirthMonth, '月')}
          {renderDropdown('day', '日', birthDay, days, setBirthDay, '日')}
        </View>

        <Text style={styles.noticeText}>
          ※18歳未満の方は利用できません
        </Text>

        <Text style={styles.label}>居住地</Text>
        {renderDropdown(
          'prefecture',
          '都道府県を選択',
          prefecture,
          prefectures,
          setPrefecture
        )}

        <Text style={styles.label}>自己紹介</Text>
        <TextInput
          style={styles.profileInput}
          multiline
          value={profile}
          onChangeText={setProfile}
          placeholder="自己紹介を入力してください"
        />

        <Text style={styles.label}>趣味</Text>
        <TextInput
          style={styles.input}
          value={hobbies}
          onChangeText={setHobbies}
          placeholder="例：映画, カフェ, 旅行"
        />

        <Text style={styles.label}>休日の過ごし方</Text>
        <TextInput
          style={styles.input}
          value={holiday}
          onChangeText={setHoliday}
          placeholder="例：カフェでゆっくり過ごします"
        />

        <Text style={styles.label}>職業</Text>
        <TextInput
          style={styles.input}
          value={job}
          onChangeText={setJob}
          placeholder="例：会社員"
        />

        <TouchableOpacity
          style={[styles.primaryButton, isSaving && styles.primaryButtonDisabled]}
          onPress={saveProfile}
          disabled={isSaving}
        >
          <Text style={styles.primaryButtonText}>
            {isSaving ? '保存中...' : '保存する'}
          </Text>
        </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const colors = {
  background: '#fff7f5',
  card: '#ffffff',
  primary: '#8f2d56',
  disabled: '#c9c1c4',
  text: '#2b2226',
  subText: '#75666c',
  border: '#ead9de',
  danger: '#c0392b',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    width: '100%',
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 56,
  },
  formCard: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
  },
  backText: {
    color: colors.primary,
    fontWeight: '800',
    marginBottom: 16,
  },
  pageTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 8,
  },
  pageSubTitle: {
    fontSize: 14,
    color: colors.subText,
    marginBottom: 26,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
    marginTop: 18,
  },
  noticeText: {
    fontSize: 12,
    color: colors.subText,
    marginTop: 8,
  },
  photoItem: {
    width: 116,
    height: 116,
    borderRadius: 18,
    marginRight: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  photoPreview: {
    width: '100%',
    height: '100%',
  },
  mainPhotoBadge: {
    position: 'absolute',
    left: 6,
    top: 6,
    backgroundColor: colors.primary,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  mainPhotoBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
  },
  removePhotoButton: {
    position: 'absolute',
    right: 6,
    top: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.danger,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removePhotoText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 20,
  },
  addPhotoButton: {
    width: 116,
    height: 116,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addPhotoIcon: {
    color: colors.primary,
    fontSize: 30,
    fontWeight: '800',
  },
  addPhotoText: {
    color: colors.primary,
    fontWeight: '800',
    marginTop: 4,
  },
  photoNote: {
    color: colors.subText,
    fontSize: 12,
    marginTop: 8,
  },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  profileInput: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    height: 130,
    textAlignVertical: 'top',
  },
  choiceRow: {
    flexDirection: 'row',
    gap: 12,
  },
  choiceButton: {
    flex: 1,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
  },
  choiceButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  choiceText: {
    fontWeight: '700',
    color: colors.text,
  },
  choiceTextActive: {
    color: '#fff',
  },
  birthdayRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dropdownWrapper: {
    position: 'relative',
    zIndex: 20,
  },
  dropdownButton: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  placeholderText: {
    color: colors.subText,
  },
  dropdownArrow: {
    fontSize: 10,
    color: colors.subText,
  },
  dropdownList: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    marginTop: 6,
    maxHeight: 190,
    zIndex: 30,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dropdownItemText: {
    fontSize: 15,
    color: colors.text,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 18,
    paddingVertical: 17,
    alignItems: 'center',
    marginTop: 28,
  },
  primaryButtonDisabled: {
    backgroundColor: colors.disabled,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
  },
});