import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
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
  const [messageText, setMessageText] = useState('');
  const [myUserId, setMyUserId] = useState<string | null>(null);

  useEffect(() => {
    loadMessages();

    const interval = setInterval(() => {
      loadMessages();
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const loadMessages = async () => {
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    if (!currentUser) return;

    setMyUserId(currentUser.id);

    const { data, error } = await supabase
      .from('messages')
      .select('*')
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
    if (!myUserId || !messageText.trim()) return;

    const { error } = await supabase.from('messages').insert({
      sender_id: myUserId,
      receiver_id: user.id,
      content: messageText.trim(),
      is_read: false,
    });

    if (error) {
      alert(error.message);
      return;
    }

    setMessageText('');
    loadMessages();
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack}>
            <Text style={styles.backText}>← 戻る</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.blockButton} onPress={blockUser}>
            <Text style={styles.blockButtonText}>ブロック</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.title}>{user.name}</Text>

        <View style={styles.chatArea}>
          <ScrollView
            style={styles.messageList}
            contentContainerStyle={styles.messageListContent}
            showsVerticalScrollIndicator={false}
          >
            {messages.length === 0 ? (
              <View style={styles.emptyArea}>
                <Text style={styles.emptyText}>まだメッセージはありません</Text>
                <Text style={styles.emptySubText}>最初のメッセージを送ってみましょう</Text>
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
              value={messageText}
              onChangeText={setMessageText}
              placeholder="メッセージを入力"
              multiline
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
  screen: {
    flex: 1,
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  backText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '800',
  },
  blockButton: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
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
  chatArea: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  messageList: {
    flex: 1,
    backgroundColor: colors.background,
  },
  messageListContent: {
    padding: 14,
    paddingBottom: 24,
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
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    minHeight: 50,
    maxHeight: 110,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: colors.background,
    fontSize: 15,
    color: colors.text,
    textAlignVertical: 'top',
  },
  sendButton: {
    width: 62,
    minHeight: 50,
    borderRadius: 16,
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