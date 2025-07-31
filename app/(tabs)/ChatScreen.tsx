import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import React, { useEffect, useRef, useState } from 'react';
import { FlatList, Keyboard, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '../../constants/Colors';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

interface Message {
  id: string;
  user_id: string;
  family_member_id: string;
  content: string;
  created_at: string;
  sender_name: string;
}

interface FamilyMember {
  id: string;
  name: string;
}

export default function ChatScreen () {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedFamilyMember, setSelectedFamilyMember] = useState<string>('');
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  // Mensagem inicial com resumo financeiro
  const initialMessage: Message = {
    id: 'initial',
    user_id: 'system',
    family_member_id: 'system',
    content: `Resumo Financeiro\n\nSaldo total: R$ -2.546,00\nOrçamento mensal: R$ 1.400,00\nDespesas totais: R$ 1.175,00\nÚltima despesa: Internet (R$ 60,00)\nPago por: Anne\nData: ${new Date('2025-07-30T06:03:38.887574+00:00').toLocaleDateString('pt-BR')}`,
    created_at: new Date().toISOString(),
    sender_name: 'Sistema Financeiro',
  };

  // Função para obter o nome do usuário selecionado
  const getSelectedUserName = () => {
    const selectedMember = familyMembers.find(member => member.id === selectedFamilyMember);
    return selectedMember ? selectedMember.name : 'Nenhum usuário selecionado';
  };

  // Carregar membros da família
  useEffect(() => {
    if (!user) return;

    const fetchFamilyMembers = async () => {
      const { data, error } = await supabase
        .from('family_members')
        .select('id, name')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Erro ao buscar membros da família:', error);
        return;
      }

      setFamilyMembers(data || []);
      if (data.length > 0) {
        setSelectedFamilyMember(data[0].id);
      }
    };

    fetchFamilyMembers();
    setMessages([initialMessage]);
    fetchMessages();

    const subscription = supabase
      .channel('public:messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => {
        fetchMessages();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [user]);

  // Listener para o teclado
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (event) => {
      setKeyboardHeight(event.endCoordinates.height);
    });

    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
    });

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, []);

  const fetchMessages = async () => {
    if (!user) return;

    const { data: messagesData, error: messagesError } = await supabase
      .from('messages')
      .select('id, user_id, family_member_id, content, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (messagesError) {
      console.error('Erro ao buscar mensagens:', messagesError);
      return;
    }

    const formattedMessages = await Promise.all(
      messagesData.map(async (msg: any) => {
        const { data: familyMember, error: familyError } = await supabase
          .from('family_members')
          .select('name')
          .eq('id', msg.family_member_id)
          .single();

        return {
          id: msg.id,
          user_id: msg.user_id,
          family_member_id: msg.family_member_id,
          content: msg.content,
          created_at: msg.created_at,
          sender_name: familyError ? 'Usuário Desconhecido' : familyMember?.name || 'Usuário Desconhecido',
        };
      })
    );

    setMessages([initialMessage, ...formattedMessages]);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !user || !selectedFamilyMember) return;

    const { error } = await supabase.from('messages').insert({
      user_id: user.id,
      family_member_id: selectedFamilyMember,
      content: newMessage.trim(),
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error('Erro ao enviar mensagem:', error);
      return;
    }

    setNewMessage('');
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isCurrentUser = item.family_member_id === selectedFamilyMember;
    const isSystemMessage = item.user_id === 'system';

    return (
      <View style={styles.messageWrapper}>
        <View
          style={[
            styles.messageContainer,
            isCurrentUser
              ? styles.messageSent
              : isSystemMessage
                ? styles.systemMessage
                : styles.messageReceived,
          ]}
        >
          {!isCurrentUser && (
            <View style={styles.senderContainer}>
              <View style={[
                styles.avatarContainer,
                { backgroundColor: isSystemMessage ? Colors.light.illustrationCyan : Colors.light.illustrationPurple }
              ]}>
                {isSystemMessage ? (
                  <MaterialIcons name="smart-toy" size={16} color={Colors.light.textWhite} />
                ) : (
                  <Text style={styles.avatarText}>
                    {item.sender_name.charAt(0).toUpperCase()}
                  </Text>
                )}
              </View>
              <Text style={styles.senderName}>{item.sender_name}</Text>
            </View>
          )}

          <View style={[
            styles.messageBubble,
            isCurrentUser
              ? styles.bubbleSent
              : isSystemMessage
                ? styles.bubbleSystem
                : styles.bubbleReceived,
          ]}>
            <Text style={[
              styles.messageText,
              isCurrentUser ? styles.messageTextSent : styles.messageTextReceived
            ]}>
              {item.content}
            </Text>
            <Text style={[
              styles.messageTime,
              isCurrentUser ? styles.messageTimeSent : styles.messageTimeReceived
            ]}>
              {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header com gradiente */}
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <Ionicons name="chatbubbles" size={20} color={Colors.light.textWhite} />
          <Text style={styles.headerTitle}>Chat Familiar</Text>
        </View>
        <Text style={styles.headerSubtitle}>Converse sobre as finanças da família</Text>

        {/* Indicador do usuário selecionado */}
        <View style={styles.selectedUserContainer}>
          <Ionicons name="person" size={14} color={Colors.light.textWhite} />
          <Text style={styles.selectedUserText}>Enviando como: {getSelectedUserName()}</Text>
        </View>
      </View>

      <View style={styles.chatContainer}>
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.messageList,
            { paddingBottom: keyboardHeight > 0 ? 20 : 80 }
          ]}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          keyboardShouldPersistTaps="handled"
        />

        {/* Input container moderno */}
        <View style={[
          styles.inputContainer,
          Platform.OS === 'ios' && keyboardHeight > 0 && {
            marginBottom: keyboardHeight - insets.bottom
          }
        ]}>
          <View style={styles.inputWrapper}>
            {/* Picker personalizado */}
            <View style={styles.pickerContainer}>
              <Ionicons name="person" size={16} color={Colors.light.text} />
              <Picker
                style={styles.picker}
                selectedValue={selectedFamilyMember}
                onValueChange={(itemValue) => setSelectedFamilyMember(itemValue)}
                dropdownIconColor={Colors.light.text}
              >
                <Picker.Item label="Selecione..." value="" />
                {familyMembers.map((member) => (
                  <Picker.Item key={member.id} label={member.name} value={member.id} />
                ))}
              </Picker>
            </View>

            {/* Input de mensagem */}
            <TextInput
              style={styles.input}
              value={newMessage}
              onChangeText={setNewMessage}
              placeholder="Digite sua mensagem..."
              placeholderTextColor={Colors.light.mutedText}
              multiline
              maxLength={500}
              onFocus={() => {
                setTimeout(() => {
                  flatListRef.current?.scrollToEnd({ animated: true });
                }, 100);
              }}
            />

            {/* Botão de enviar moderno */}
            <TouchableOpacity
              style={[
                styles.sendButton,
                { opacity: (!selectedFamilyMember || !newMessage.trim()) ? 0.5 : 1 }
              ]}
              onPress={sendMessage}
              disabled={!selectedFamilyMember || !newMessage.trim()}
            >
              <Ionicons name="send" size={16} color={Colors.light.textWhite} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    backgroundColor: Colors.light.primary,
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.textWhite,
    marginLeft: 8,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.light.textWhite,
    opacity: 0.9,
    textAlign: 'center',
    marginBottom: 8,
  },
  selectedUserContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'center',
  },
  selectedUserText: {
    fontSize: 11,
    color: Colors.light.textWhite,
    marginLeft: 4,
    fontWeight: '500',
  },
  chatContainer: {
    flex: 1,
  },
  messageList: {
    padding: 12,
    paddingBottom: 16,
    flexGrow: 1,
  },
  messageWrapper: {
    marginVertical: 4,
  },
  messageContainer: {
    maxWidth: '80%',
  },
  messageSent: {
    alignSelf: 'flex-end',
  },
  messageReceived: {
    alignSelf: 'flex-start',
  },
  systemMessage: {
    alignSelf: 'center',
    maxWidth: '90%',
  },
  senderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  avatarContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.textWhite,
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.text,
  },
  messageBubble: {
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  bubbleSent: {
    backgroundColor: Colors.light.primary,
    borderBottomRightRadius: 4,
  },
  bubbleReceived: {
    backgroundColor: Colors.light.cardBackground,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
  },
  bubbleSystem: {
    backgroundColor: Colors.light.accentBlue,
    borderRadius: 12,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  messageTextSent: {
    color: Colors.light.textWhite,
  },
  messageTextReceived: {
    color: Colors.light.text,
  },
  messageTime: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  messageTimeSent: {
    color: Colors.light.textWhite,
    opacity: 0.8,
  },
  messageTimeReceived: {
    color: Colors.light.mutedText,
  },
  inputContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.light.backgroundSecondary,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 20,
    paddingHorizontal: 4,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 2,
  },
  pickerContainer: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 16,
    marginRight: 6,
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
    minWidth: 90,
    maxWidth: 120,
    justifyContent: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 8,
  },
  picker: {
    flex: 1,
    height: 36,
    color: Colors.light.text,
    backgroundColor: 'transparent',
    fontSize: 13,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: Colors.light.text,
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxHeight: 80,
    minHeight: 36,
  },
  sendButton: {
    backgroundColor: Colors.light.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
});