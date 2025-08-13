import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import React, { useEffect, useRef, useState } from 'react';
import { FlatList, Keyboard, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Modal from 'react-native-modal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '../../constants/Colors';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

interface Message {
  id: string | number;
  user_id: string;
  family_member_id: string | number;
  content: string;
  created_at: string;
  sender_name: string;
}

interface FamilyMember {
  id: string | number;
  name: string;
}

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedFamilyMember, setSelectedFamilyMember] = useState<string | number>('');
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const initialMessage: Message = {
    id: 'initial',
    user_id: 'system',
    family_member_id: 'system',
    content: `🤖 Avisos do Sistema\n\n💬 Este chat é para discussões sobre as finanças familiares\n\n⏰ As mensagens têm duração de 24 horas\n\n🗑️ Mensagens antigas são automaticamente removidas após 1 dia\n\n✨ Use este espaço para coordenar gastos, discutir orçamentos e organizar as finanças da família!`,
    created_at: new Date().toISOString(),
    sender_name: 'Sistema Automático',
  };

  const getSelectedUserName = () => {
    const selectedMember = familyMembers.find(member => member.id === selectedFamilyMember);
    return selectedMember ? selectedMember.name : 'Nenhum usuário selecionado';
  };

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
      if (data && data.length > 0) {
        setIsModalVisible(true); // Mostrar modal apenas após carregar os membros
      } else {
        setIsModalVisible(false); // Evitar modal se não houver membros
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

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (event) => {
      setKeyboardHeight(event.endCoordinates.height);
      setIsTyping(true);
    });

    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
      setIsTyping(false);
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

  const handleSendMessage = () => {
    if (!newMessage.trim() || !user || !selectedFamilyMember) return;
    confirmSendMessage(); // Enviar diretamente sem modal de confirmação
  };

  const confirmSendMessage = async () => {
    if (!newMessage.trim() || !user || !selectedFamilyMember) return;

    const { error } = await supabase.from('messages').insert({
      user_id: user.id,
      family_member_id: selectedFamilyMember,
      content: newMessage.trim(),
    });

    if (error) {
      console.error('Erro ao enviar mensagem:', error);
      return;
    }

    setNewMessage('');
  };

  const confirmSenderSelection = () => {
    if (selectedFamilyMember) {
      setIsModalVisible(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isCurrentUser = String(item.family_member_id) === String(selectedFamilyMember);
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
                  <MaterialIcons name="smart-toy" size={18} color={Colors.light.textWhite} />
                ) : (
                  <Text style={styles.avatarText}>
                    {item.sender_name.charAt(0).toUpperCase()}
                  </Text>
                )}
              </View>
              <Text style={styles.senderName}>{item.sender_name}</Text>
            </View>
          )}

          {isCurrentUser && (
            <View style={styles.currentUserIndicator}>
              <Text style={styles.currentUserText}>Você ({item.sender_name})</Text>
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

            <View style={styles.messageFooter}>
              <Text style={[
                styles.messageTime,
                isCurrentUser ? styles.messageTimeSent : styles.messageTimeReceived
              ]}>
                {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerTitleContainer}>
            <Ionicons name="chatbubbles" size={20} color={Colors.light.textWhite} />
            <Text style={styles.headerTitle}>Chat Familiar</Text>
          </View>
        </View>

        <Text style={styles.headerSubtitle}>Converse sobre as finanças da família</Text>

        <View style={styles.selectedUserContainer}>
          <View style={styles.selectedUserIndicator}>
            <Ionicons name="person" size={16} color={Colors.light.textWhite} />
            <Text style={styles.selectedUserText}>Enviando como: {getSelectedUserName()}</Text>
          </View>
        </View>
      </View>

      <View style={styles.chatContainer}>
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={[
            styles.messageList,
            {
              paddingBottom: isTyping ? keyboardHeight + 100 : 100,
              minHeight: '100%'
            }
          ]}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          keyboardShouldPersistTaps="handled"
        />

        <Modal
          isVisible={isModalVisible}
          onBackdropPress={() => { }}
          backdropOpacity={0.3}
          animationIn="slideInUp"
          animationOut="slideOutDown"
          style={styles.modal}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Selecione o Remetente</Text>
            <Text style={styles.modalText}>
              Escolha quem você é para usar o chat:
            </Text>
            <View style={styles.modalPickerContainer}>
              <Ionicons name="person" size={16} color={Colors.light.primary} />
              <Picker
                style={styles.modalPicker}
                selectedValue={selectedFamilyMember}
                onValueChange={(itemValue) => setSelectedFamilyMember(itemValue)}
                itemStyle={styles.pickerItem}
                mode="dropdown" // Forçar modo dropdown para melhor controle
              >
                {familyMembers.length > 0 ? (
                  familyMembers.map((member) => (
                    <Picker.Item
                      key={member.id}
                      label={member.name}
                      value={member.id}
                      style={styles.pickerItem}
                    />
                  ))
                ) : (
                  <Picker.Item label="Nenhum membro disponível" value="" />
                )}
              </Picker>
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={confirmSenderSelection}
                disabled={!selectedFamilyMember}
              >
                <Text style={styles.modalButtonText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <View style={[
          styles.inputContainer,
          {
            backgroundColor: isTyping ? Colors.light.cardBackground : Colors.light.backgroundSecondary,
            borderTopWidth: isTyping ? 2 : 1,
            borderTopColor: isTyping ? Colors.light.primary : Colors.light.borderLight,
          },
          Platform.OS === 'ios' && keyboardHeight > 0 && {
            marginBottom: keyboardHeight - insets.bottom
          }
        ]}>
          <View style={[
            styles.inputWrapper,
            {
              backgroundColor: isTyping ? Colors.light.backgroundSecondary : Colors.light.cardBackground,
              borderWidth: isTyping ? 2 : 1,
              borderColor: isTyping ? Colors.light.primary : Colors.light.borderLight,
              opacity: !selectedFamilyMember ? 0.5 : 1,
            }
          ]}>
            <View style={styles.pickerContainer}>
              <Ionicons name="person" size={16} color={Colors.light.primary} />
              <Picker
                style={styles.picker}
                selectedValue={selectedFamilyMember}
                onValueChange={(itemValue) => setSelectedFamilyMember(itemValue)}
                dropdownIconColor={Colors.light.primary}
                enabled={false}
                itemStyle={styles.pickerItem}
                mode="dropdown"
              >
                <Picker.Item label="Selecione..." value="" />
                {familyMembers.map((member) => (
                  <Picker.Item
                    key={member.id}
                    label={member.name}
                    value={member.id}
                    style={styles.pickerItem}
                  />
                ))}
              </Picker>
            </View>

            <TextInput
              style={[
                styles.input,
                { borderColor: isTyping ? Colors.light.primary : 'transparent' }
              ]}
              value={newMessage}
              onChangeText={setNewMessage}
              placeholder="Digite sua mensagem..."
              placeholderTextColor={Colors.light.mutedText}
              multiline
              maxLength={500}
              editable={!!selectedFamilyMember}
              onFocus={() => {
                setTimeout(() => {
                  flatListRef.current?.scrollToEnd({ animated: true });
                }, 200);
              }}
            />

            <TouchableOpacity
              style={[
                styles.sendButton,
                {
                  opacity: (!selectedFamilyMember || !newMessage.trim()) ? 0.5 : 1,
                  transform: [{ scale: isTyping ? 1.1 : 1 }]
                }
              ]}
              onPress={handleSendMessage}
              disabled={!selectedFamilyMember || !newMessage.trim()}
            >
              <Ionicons name="send" size={18} color={Colors.light.textWhite} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    backgroundColor: Colors.light.primary,
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.textWhite,
    marginLeft: 8,
  },
  headerSubtitle: {
    fontSize: 13,
    color: Colors.light.textWhite,
    opacity: 0.9,
    textAlign: 'center',
    marginBottom: 12,
  },
  selectedUserContainer: {
    alignItems: 'center',
  },
  selectedUserIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  selectedUserText: {
    fontSize: 12,
    color: Colors.light.textWhite,
    marginLeft: 6,
    fontWeight: '600',
  },
  chatContainer: {
    flex: 1,
  },
  messageList: {
    padding: 16,
    paddingTop: 20,
  },
  messageWrapper: {
    marginVertical: 6,
  },
  messageContainer: {
    maxWidth: '85%',
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
    marginBottom: 8,
    backgroundColor: Colors.light.cardBackground,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  currentUserIndicator: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.light.cardBackground,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  currentUserText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.light.primary,
  },
  avatarContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.textWhite,
  },
  senderName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.light.text,
  },
  messageBubble: {
    borderRadius: 18,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 4,
  },
  bubbleSent: {
    backgroundColor: Colors.light.primary,
    borderBottomRightRadius: 6,
  },
  bubbleReceived: {
    backgroundColor: Colors.light.cardBackground,
    borderBottomLeftRadius: 6,
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
  },
  bubbleSystem: {
    backgroundColor: Colors.light.accentBlue,
    borderRadius: 16,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  messageTextSent: {
    color: Colors.light.textWhite,
  },
  messageTextReceived: {
    color: Colors.light.text,
  },
  messageFooter: {
    marginTop: 6,
  },
  messageTime: {
    fontSize: 10,
    fontWeight: '500',
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: 24,
    paddingHorizontal: 6,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  pickerContainer: {
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 18,
    marginRight: 8,
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
    minWidth: 100,
    maxWidth: 150,
    justifyContent: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 10,
  },
  picker: {
    flex: 1,
    height: 40,
    color: Colors.light.text,
    backgroundColor: 'transparent',
    fontSize: 13,
    fontWeight: '500',
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: Colors.light.text,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
    minHeight: 40,
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 18,
    borderWidth: 1,
  },
  sendButton: {
    backgroundColor: Colors.light.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  modal: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  modalContent: {
    backgroundColor: Colors.light.cardBackground,
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    alignItems: 'center',
    maxHeight: '70%', // Limitar altura máxima para evitar sobreposição
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 10,
  },
  modalText: {
    fontSize: 16,
    color: Colors.light.text,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalBoldText: {
    fontWeight: '700',
    color: Colors.light.primary,
  },
  modalPickerContainer: {
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
    width: '95%', // Aumentado para suportar nomes mais longos
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 10,
    marginBottom: 20,
  },
  modalPicker: {
    flex: 1,
    height: 70,
    color: Colors.light.text,
    backgroundColor: 'transparent',
    fontSize: 14,
    fontWeight: '500',
  },
  pickerItem: {
    fontSize: 14,
    color: Colors.light.text,
    paddingHorizontal: 10, // Adicionar padding para evitar corte
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '80%',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 8,
    maxWidth: 150,
  },
  confirmButton: {
    backgroundColor: Colors.light.primary,
  },
  modalButtonText: {
    color: Colors.light.textWhite,
    fontSize: 16,
    fontWeight: '600',
  },
});