import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, useColorScheme } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import Colors from '../constants/Colors';

interface ConstructionModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function ConstructionModal({ visible, onClose }: ConstructionModalProps) {
  const colorScheme = useColorScheme() as 'light' | 'dark';
  const theme = Colors[colorScheme] || Colors.light;
  const isDark = colorScheme === 'dark';

  const themeColors = isDark
    ? {
        text: theme.text, // #131313
        accent: '#252525',
        highlight: theme.tint, // #f86565
        secondary: theme.tabIconDefault, // #B0B0B0
        btn: 'black'
      }
    : {
        text: theme.text, // #2E2E2E
        accent: '#f4f4f4',
        highlight: theme.tint, // #3E8E7E
        secondary: theme.tabIconDefault, // #B0B0B0
        btn: 'white'
      };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
      accessibilityLabel="Modal de funcionalidade em construção"
    >
      <TouchableOpacity style={styles.overlay} onPress={onClose} activeOpacity={1}>
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(200)}
          style={[styles.modalContainer, { backgroundColor: themeColors.accent }]}
        >
          <Text style={[styles.modalTitle, { color: themeColors.text }]}>
            Funcionalidade em Construção
          </Text>
          <Text style={[styles.modalMessage, { color: themeColors.secondary }]}>
            Esta funcionalidade está em desenvolvimento e estará disponível em breve.
          </Text>
          <TouchableOpacity
            style={[styles.closeButton, { backgroundColor: themeColors.highlight }]}
            onPress={onClose}
            accessibilityLabel="Fechar modal"
          >
            <Text style={[styles.closeButtonText, { color: themeColors.btn }]}>Fechar</Text>
          </TouchableOpacity>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '80%',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'center',
    marginBottom: 20,
  },
  closeButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});