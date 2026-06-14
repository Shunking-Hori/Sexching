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
  Alert,
} from 'react-native';
import { supabase } from '../lib/supabase';

type Props = {
  partnerId: string;
  partnerName: string;
  onBack: () => void;
};

type Message = {
  id: number;
  sender_id: string;
  receiver_id: string;
  message: string;
  created_at: string;
  is_read: boolean;
};

export function ChatScreen({ partnerId, partnerName, onBack }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [myId, setMyId] = useState('');
  const [isSending, setIsSending] = useState(false);

  const scrollRef = useRef<ScrollView | null>(null);

  useEffect(() => {
    initializeChat();

    const channel = supabase
      .channel(`messages-${partnerId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
        },
        async () => {
          await loadMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const initializeChat = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    setMyId(user.id);

    await markMessagesAsRead(user.id);
    await loadMessages();
  };

  const markMessagesAsRead = async (userId: string) => {
    const { error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('sender_id', partnerId)
      .eq('receiver_id', userId)
      .eq('is_read', false);

    if (error) {
      console.log('既読更新エラー:', error.message);
    }
  };

  const loadMessages = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    setMyId(user.id);

    await markMessagesAsRead(user.id);

    const { data, error } = await supabase
      .from('messages')
      .select('id, sender_id, receiver_id, message, created_at, is_read')
      .or(
        `and(sender_id.eq.${user.id},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${user.id})`
      )
      .order('created_at', { ascending: true });

    if (error) {
      alert(error.message);
      return;
    }

    setMessages(data || []);

    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleBack = async () => {
    if (myId) {
      await markMessagesAsRead(myId);
    }

    onBack();
  };


  const confirmBlock = (): Promise<boolean> => {
    if (Platform.OS === 'web') {
      const webConfirm = (globalThis as unknown as { confirm?: (message: string) => boolean }).confirm;
      return Promise.resolve(
        typeof webConfirm === 'function'
          ? webConfirm(`${partnerName}さんをブロックしますか？`)
          : true
      );
    }

    return new Promise((resolve) => {
      Alert.alert('ブロック', `${partnerName}さんをブロックしますか？`, [
        { text: 'キャンセル', style: 'cancel', onPress: () => resolve(false) },
        { text: 'ブロック', style: 'destructive', onPress: () => resolve(true) },
      ]);
    });
  };

  const blockUser = async () => {
    if (!myId) {
      alert('ログイン情報を取得できませんでした。');
      return;
    }

    const shouldBlock = await confirmBlock();
    if (!shouldBlock) return;

    const { error } = await supabase.from('blocks').insert({
      from_user: myId,
      to_user: partnerId,
    });

    if (error && error.code !== '23505') {
      alert(error.message);
      return;
    }

    await supabase
      .from('likes')
      .update({ is_match: false, status: 'blocked' })
      .or(
        `and(from_user.eq.${myId},to_user.eq.${partnerId}),and(from_user.eq.${partnerId},to_user.eq.${myId})`
      );

    onBack();
  };

  const sendMessage = async () => {
    if (!text.trim() || !myId || isSending) return;

    setIsSending(true);

    const { error } = await supabase.from('messages').insert({
      sender_id: myId,
      receiver_id: partnerId,
      message: text.trim(),
      is_read: false,
    });

    setIsSending(false);

    if (error) {
      alert(error.message);
      return;
    }

    setText('');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack}>
          <Text style={styles.backText}>← 戻る</Text>
        </TouchableOpacity>

        <View style={styles.headerTitleRow}>
          <Text style={styles.headerTitle}>{partnerName}</Text>

          <TouchableOpacity style={styles.blockButton} onPress={blockUser}>
            <Text style={styles.blockButtonText}>ブロック</Text>
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.chatArea}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.messageList}
          contentContainerStyle={styles.messageListContent}
        >
          {messages.length === 0 && (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>まだメッセージはありません。</Text>
            </View>
          )}

          {messages.map((message) => {
            const isMine = message.sender_id === myId;

            return (
              <View
                key={message.id}
                style={[
                  styles.messageBlock,
                  isMine ? styles.myMessageBlock : styles.partnerMessageBlock,
                ]}
              >
                <View
                  style={[
                    styles.messageBubble,
                    isMine ? styles.myMessage : styles.partnerMessage,
                  ]}
                >
                  <Text
                    style={[
                      styles.messageText,
                      isMine ? styles.myMessageText : styles.partnerMessageText,
                    ]}
                  >
                    {message.message}
                  </Text>

                  <Text
                    style={[
                      styles.messageTime,
                      isMine ? styles.myMessageTime : styles.partnerMessageTime,
                    ]}
                  >
                    {new Date(message.created_at).toLocaleTimeString()}
                  </Text>
                </View>

                {isMine && (
                  <Text style={styles.readStatus}>
                    {message.is_read ? '既読' : '未読'}
                  </Text>
                )}
              </View>
            );
          })}
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
      </KeyboardAvoidingView>
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
  partnerBubble: '#ffffff',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
  },
  header: {
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  backText: {
    color: colors.primary,
    fontWeight: '800',
    marginBottom: 6,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
  },

  headerTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  blockButton: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  blockButtonText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  chatArea: {
    flex: 1,
  },
  messageList: {
    flex: 1,
  },
  messageListContent: {
    padding: 20,
  },
  emptyBox: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyText: {
    color: colors.subText,
    textAlign: 'center',
  },
  messageBlock: {
    marginBottom: 12,
  },
  myMessageBlock: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  partnerMessageBlock: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '72%',
    minWidth: 120,
    borderRadius: 18,
    padding: 12,
  },
  myMessage: {
    backgroundColor: colors.primary,
  },
  partnerMessage: {
    backgroundColor: colors.partnerBubble,
    borderWidth: 1,
    borderColor: colors.border,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
    flexShrink: 1,
  },
  myMessageText: {
    color: '#fff',
  },
  partnerMessageText: {
    color: colors.text,
  },
  messageTime: {
    fontSize: 10,
    marginTop: 6,
    textAlign: 'right',
  },
  myMessageTime: {
    color: '#f7e6ef',
  },
  partnerMessageTime: {
    color: colors.subText,
  },
  readStatus: {
    fontSize: 11,
    color: colors.subText,
    marginTop: 4,
    marginRight: 4,
  },
  inputArea: {
    flexDirection: 'row',
    gap: 10,
    padding: 14,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  input: {
    flex: 1,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxHeight: 90,
  },
  sendButton: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingHorizontal: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.disabled,
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: '800',
  },
});