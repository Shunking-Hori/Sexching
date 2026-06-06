import React, { useMemo, useState } from 'react';
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
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../lib/supabase';
import { prefectures } from '../constants/prefectures';

type Props = {
  onComplete: () => void;
};

type DropdownType = 'year' | 'month' | 'day' | 'prefecture' | null;

export function ProfileScreen({ onComplete }: Props) {
  const [nickname, setNickname] = useState('');
  const [gender, setGender] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [birthMonth, setBirthMonth] = useState('');
  const [birthDay, setBirthDay] = useState('');
  const [prefecture, setPrefecture] = useState('');
  const [profile, setProfile] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [openDropdown, setOpenDropdown] = useState<DropdownType>(null);
  const [isSaving, setIsSaving] = useState(false);

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

  const isBirthdayComplete = Boolean(birthYear && birthMonth && birthDay);

  const isOver18 = useMemo(() => {
    if (!isBirthdayComplete) return false;

    const today = new Date();
    const birthday = new Date(
      Number(birthYear),
      Number(birthMonth) - 1,
      Number(birthDay)
    );

    const eighteenBirthday = new Date(
      birthday.getFullYear() + 18,
      birthday.getMonth(),
      birthday.getDate()
    );

    return today >= eighteenBirthday;
  }, [birthYear, birthMonth, birthDay, isBirthdayComplete]);

  const canSubmit =
    nickname.trim().length > 0 &&
    Boolean(gender) &&
    isOver18 &&
    Boolean(prefecture) &&
    !isSaving;

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
      setPhotoUri(publicUrl);
      alert('写真をアップロードしました。');
    } catch {
      alert('写真のアップロードに失敗しました。');
    }
  };

  const saveProfile = async () => {
    if (!canSubmit) return;

    setIsSaving(true);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      alert('ログイン情報を取得できませんでした。もう一度ログインしてください。');
      setIsSaving(false);
      return;
    }

    const photoUrls = photoUri ? [photoUri] : [];

    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      nickname: nickname.trim(),
      gender,
      birth_year: Number(birthYear),
      birth_month: Number(birthMonth),
      birth_day: Number(birthDay),
      prefecture,
      profile: profile.trim(),
      photo_url: photoUri,
      photo_urls: photoUrls,
      hobbies: '',
      holiday: '',
      job: '',
    });

    setIsSaving(false);

    if (error) {
      alert(error.message);
      return;
    }

    alert('プロフィールを保存しました。');
    onComplete();
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
      <ScrollView contentContainerStyle={styles.formContainer}>
        <Text style={styles.pageTitle}>プロフィール登録</Text>

        <Text style={styles.pageSubTitle}>
          あなたの雰囲気が伝わるように入力しましょう
        </Text>

        <Text style={styles.label}>プロフィール写真</Text>
        <TouchableOpacity style={styles.photoPicker} onPress={pickImage}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.photoPreview} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Text style={styles.photoIcon}>＋</Text>
              <Text style={styles.photoText}>写真を選択</Text>
            </View>
          )}
        </TouchableOpacity>

        {photoUri && (
          <TouchableOpacity style={styles.changePhotoButton} onPress={pickImage}>
            <Text style={styles.changePhotoText}>写真を変更する</Text>
          </TouchableOpacity>
        )}

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

        {isBirthdayComplete && !isOver18 && (
          <Text style={styles.errorText}>18歳未満の方は登録できません</Text>
        )}

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
          placeholder="休日の過ごし方や、どんな出会いを探しているかを書いてみましょう"
        />

        <TouchableOpacity
          style={[
            styles.primaryButton,
            !canSubmit && styles.primaryButtonDisabled,
          ]}
          onPress={saveProfile}
          disabled={!canSubmit}
        >
          <Text style={styles.primaryButtonText}>
            {isSaving ? '保存中...' : '登録してはじめる'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <StatusBar style="dark" />
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
  error: '#b3261e',
  accent: '#f4d4dc',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  formContainer: {
    padding: 22,
    paddingBottom: 50,
  },
  pageTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: colors.text,
    marginTop: 12,
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
  photoPicker: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 22,
    height: 190,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  photoPlaceholder: {
    alignItems: 'center',
  },
  photoIcon: {
    fontSize: 34,
    color: colors.primary,
    fontWeight: '800',
    marginBottom: 6,
  },
  photoText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '800',
  },
  photoPreview: {
    width: '100%',
    height: '100%',
  },
  changePhotoButton: {
    alignSelf: 'center',
    marginTop: 10,
  },
  changePhotoText: {
    color: colors.primary,
    fontWeight: '800',
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
    fontSize: 15,
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
  errorText: {
    color: colors.error,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 8,
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