import React, { useEffect, useRef, useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import type { User } from '../../App';
import { supabase } from '../lib/supabase';

type Props = {
  user: User;
  onBack: () => void;
};

type Message = {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string | null;
  created_at: string;
  is_read: boolean;
};

export function ChatScreen({ user, onBack }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    loadMessages();

    const interval = setInterval(loadMessages, 3000);

    return () => clearInterval(interval);
  }, [user?.id]);

  useEffect(() => {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  const loadMessages = async () => {
    if (!user?.id) return;

    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    if (!currentUser) return;

    setMyUserId(currentUser.id);

    const { data, error } = await supabase
      .from('messages')
      .select('id, sender_id, receiver_id, message, created_at, is_read')
      .or(
        `and(sender_id.eq.${currentUser.id},receiver_id.eq.${user.id}),and(sender_id.eq.${user.id},receiver_id.eq.${currentUser.id})`
      )
      .order('created_at', { ascending: true });

    if (error) {
      alert(error.message);
      return;
    }

    setMessages(data || []);

    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('sender_id', user.id)
      .eq('receiver_id', currentUser.id)
      .eq('is_read', false);
  };

  const sendMessage = async () => {
    if (!user?.id || !myUserId || !messageText.trim()) return;

    const text = messageText.trim();

    const { error } = await supabase.from('messages').insert({
      sender_id: myUserId,
      receiver_id: user.id,
      message: text,
      is_read: false,
    });

    if (error) {
      alert(error.message);
      return;
    }

    setMessageText('');
    await loadMessages();
  };

  const blockUser = async () => {
    if (!user?.id || !myUserId) return;

    const { error } = await supabase.from('blocks').insert({
      from_user: myUserId,
      to_user: user.id,
    });

    if (error && error.code !== '23505') {
      alert(error.message);
      return;
    }

    alert('ブロックしました。');
    onBack();
  };

  const formatTime = (dateText: string) => {
    const date = new Date(dateText);

    return date.toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!user?.id) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.screen}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onBack}>
              <Text style={styles.backText}>← 戻る</Text>
            </TouchableOpacity>

            <Text style={styles.title} numberOfLines={1}>
              チャット
            </Text>

            <View style={styles.headerRightSpacer} />
          </View>

          <View style={styles.emptyArea}>
            <Text style={styles.emptyText}>ユーザー情報を取得できませんでした</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardArea}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.screen}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onBack}>
              <Text style={styles.backText}>← 戻る</Text>
            </TouchableOpacity>

            <Text style={styles.title} numberOfLines={1}>
              {user.name || 'ユーザー'}
            </Text>

            <TouchableOpacity style={styles.blockButton} onPress={blockUser}>
              <Text style={styles.blockButtonText}>ブロック</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.chatArea}>
            <ScrollView
              ref={scrollRef}
              style={styles.messageList}
              contentContainerStyle={styles.messageListContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              onContentSizeChange={() => {
                scrollRef.current?.scrollToEnd({ animated: true });
              }}
            >
              {messages.length === 0 ? (
                <View style={styles.emptyArea}>
                  <Text style={styles.emptyText}>まだメッセージはありません</Text>
                  <Text style={styles.emptySubText}>
                    最初のメッセージを送ってみましょう
                  </Text>
                </View>
              ) : (
                messages.map((message) => {
                  const isMine = message.sender_id === myUserId;

                  return (
                    <View
                      key={message.id}
                      style={[
                        styles.messageRow,
                        isMine ? styles.myMessageRow : styles.otherMessageRow,
                      ]}
                    >
                      <View
                        style={[
                          styles.messageBubble,
                          isMine ? styles.myBubble : styles.otherBubble,
                        ]}
                      >
                        <Text
                          style={[
                            styles.messageText,
                            isMine
                              ? styles.myMessageText
                              : styles.otherMessageText,
                          ]}
                        >
                          {message.message || ''}
                        </Text>

                        <Text
                          style={[
                            styles.timeText,
                            isMine ? styles.myTimeText : styles.otherTimeText,
                          ]}
                        >
                          {formatTime(message.created_at)}
                          {isMine && message.is_read ? '　既読' : ''}
                        </Text>
                      </View>
                    </View>
                  );
                })
              )}
            </ScrollView>

            <View style={styles.inputArea}>
              <TextInput
                style={styles.input}
                value={messageText}
                onChangeText={setMessageText}
                placeholder="メッセージを入力"
                placeholderTextColor={colors.subText}
                multiline={false}
                returnKeyType="send"
                onSubmitEditing={sendMessage}
              />

              <TouchableOpacity
                style={[
                  styles.sendButton,
                  !messageText.trim() && styles.sendButtonDisabled,
                ]}
                onPress={sendMessage}
                disabled={!messageText.trim()}
              >
                <Text style={styles.sendButtonText}>送信</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const colors = {
  background: '#fff7f5',
  card: '#ffffff',
  primary: '#8f2d56',
  text: '#2b2226',
  subText: '#75666c',
  border: '#ead9de',
  disabled: '#c9c1c4',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    maxWidth: '100%',
    height: Platform.OS === 'web' ? ('100dvh' as any) : '100%',
    backgroundColor: colors.background,
    overflow: 'hidden' as any,
  },
  keyboardArea: {
    flex: 1,
    width: '100%',
    maxWidth: '100%',
    overflow: 'hidden' as any,
  },
  screen: {
    flex: 1,
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingTop: Platform.OS === 'web' ? 44 : 14,
    paddingBottom: 8,
    overflow: 'hidden' as any,
  },
  header: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    flexShrink: 0,
  },
  backText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '800',
    width: 68,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  blockButton: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 6,
    width: 68,
    alignItems: 'center',
  },
  blockButtonText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  headerRightSpacer: {
    width: 68,
  },
  chatArea: {
    flex: 1,
    width: '100%',
    maxWidth: '100%',
    backgroundColor: colors.card,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  messageList: {
    flex: 1,
    width: '100%',
    maxWidth: '100%',
    backgroundColor: colors.background,
  },
  messageListContent: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 20,
  },
  emptyArea: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 13,
    color: colors.subText,
  },
  messageRow: {
    width: '100%',
    maxWidth: '100%',
    marginBottom: 12,
  },
  myMessageRow: {
    alignItems: 'flex-end',
  },
  otherMessageRow: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '82%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  myBubble: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 6,
  },
  otherBubble: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomLeftRadius: 6,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 23,
    fontWeight: '600',
  },
  myMessageText: {
    color: '#ffffff',
  },
  otherMessageText: {
    color: colors.text,
  },
  timeText: {
    fontSize: 11,
    marginTop: 5,
    textAlign: 'right',
  },
  myTimeText: {
    color: '#f8e7ee',
  },
  otherTimeText: {
    color: colors.subText,
  },
  inputArea: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
    maxWidth: '100%',
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: 'center',
    flexShrink: 0,
    overflow: 'hidden' as any,
  },
  input: {
    flex: 1,
    minWidth: 0,
    height: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingHorizontal: 14,
    backgroundColor: colors.background,
    fontSize: 16,
    color: colors.text,
  },
  sendButton: {
    width: 58,
    height: 48,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  sendButtonDisabled: {
    backgroundColor: colors.disabled,
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
});
