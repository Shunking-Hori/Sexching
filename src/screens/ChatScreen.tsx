import React, { useEffect, useState } from 'react';
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
  content: string;
  created_at: string;
  is_read: boolean;
};

export function ChatScreen({ user, onBack }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    initialize();
  }, []);

  const initialize = async () => {
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    if (!currentUser) return;

    setMyUserId(currentUser.id);
    await loadMessages(currentUser.id);
    await markMessagesAsRead(currentUser.id);
  };

  const loadMessages = async (currentUserId: string) => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(
        `and(sender_id.eq.${currentUserId},receiver_id.eq.${user.id}),and(sender_id.eq.${user.id},receiver_id.eq.${currentUserId})`
      )
      .order('created_at', { ascending: true });

    if (error) {
      alert(error.message);
      return;
    }

    setMessages(data || []);
  };

  const markMessagesAsRead = async (currentUserId: string) => {
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('sender_id', user.id)
      .eq('receiver_id', currentUserId)
      .eq('is_read', false);
  };

  const sendMessage = async () => {
    if (!myUserId || !text.trim() || isSending) return;

    setIsSending(true);

    const { error } = await supabase.from('messages').insert({
      sender_id: myUserId,
      receiver_id: user.id,
      content: text.trim(),
      is_read: false,
    });

    setIsSending(false);

    if (error) {
      alert(error.message);
      return;
    }

    setText('');
    await loadMessages(myUserId);
  };

  const blockUser = async () => {
    if (!myUserId) return;

    const { error } = await supabase.from('blocks').insert({
      from_user: myUserId,
      to_user: user.id,
    });

    if (error) {
      alert(error.message);
      return;
    }

    onBack();
  };

  const formatTime = (value: string) => {
    const date = new Date(value);
    return date.toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardArea}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onBack}>
              <Text style={styles.backText}>← 戻る</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.blockButton} onPress={blockUser}>
              <Text style={styles.blockButtonText}>ブロック</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.title}>{user.name}</Text>

          <View style={styles.chatCard}>
            <ScrollView
              style={styles.messagesArea}
              contentContainerStyle={styles.messagesContent}
              showsVerticalScrollIndicator={false}
            >
              {messages.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Text style={styles.emptyText}>
                    まだメッセージはありません。
                  </Text>
                  <Text style={styles.emptySubText}>
                    最初のひとことを送ってみましょう。
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
                        isMine ? styles.messageRowMine : styles.messageRowOther,
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
                            isMine ? styles.myMessageText : styles.otherMessageText,
                          ]}
                        >
                          {message.content}
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
                value={text}
                onChangeText={setText}
                placeholder="メッセージを入力"
                multiline
              />

              <TouchableOpacity
                style={[
                  styles.sendButton,
                  (!text.trim() || isSending) && styles.sendButtonDisabled,
                ]}
                onPress={sendMessage}
                disabled={!text.trim() || isSending}
              >
                <Text style={styles.sendButtonText}>
                  {isSending ? '送信中' : '送信'}
                </Text>
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
  accent: '#f4d4dc',
  text: '#2b2226',
  subText: '#75666c',
  border: '#ead9de',
  disabled: '#c9c1c4',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    width: '100%',
  },
  keyboardArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  backText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '800',
  },
  blockButton: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: colors.card,
  },
  blockButtonText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '800',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 14,
  },
  chatCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  messagesArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 24,
  },
  emptyBox: {
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
    marginBottom: 12,
  },
  messageRowMine: {
    alignItems: 'flex-end',
  },
  messageRowOther: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '78%',
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
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
  },
  myMessageText: {
    color: '#ffffff',
  },
  otherMessageText: {
    color: colors.text,
  },
  timeText: {
    fontSize: 10,
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
    gap: 10,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.card,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    minHeight: 52,
    maxHeight: 110,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    backgroundColor: colors.background,
    color: colors.text,
    textAlignVertical: 'top',
  },
  sendButton: {
    width: 64,
    minHeight: 52,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.disabled,
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
});