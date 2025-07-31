import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Dimensions,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Colors from '../constants/Colors';

const { width } = Dimensions.get('window');

interface FloatingCalculatorProps {}

const FloatingCalculator: React.FC<FloatingCalculatorProps> = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [display, setDisplay] = useState<string>('0');
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState<boolean>(false);

  const inputNumber = (num: number): void => {
    if (waitingForOperand) {
      setDisplay(String(num));
      setWaitingForOperand(false);
    } else {
      setDisplay(display === '0' ? String(num) : display + num);
    }
  };

  const inputOperation = (nextOperation: string): void => {
    const inputValue = parseFloat(display);

    if (previousValue === null) {
      setPreviousValue(inputValue);
    } else if (operation) {
      const currentValue = previousValue || 0;
      const newValue = calculate(currentValue, inputValue, operation);

      setDisplay(String(newValue));
      setPreviousValue(newValue);
    }

    setWaitingForOperand(true);
    setOperation(nextOperation);
  };

  const calculate = (firstValue: number, secondValue: number, operation: string): number => {
    switch (operation) {
      case '+':
        return firstValue + secondValue;
      case '-':
        return firstValue - secondValue;
      case '×':
        return firstValue * secondValue;
      case '÷':
        return firstValue / secondValue;
      default:
        return secondValue;
    }
  };

  const performCalculation = (): void => {
    const inputValue = parseFloat(display);

    if (previousValue !== null && operation) {
      const newValue = calculate(previousValue, inputValue, operation);
      setDisplay(String(newValue));
      setPreviousValue(null);
      setOperation(null);
      setWaitingForOperand(true);
    }
  };

  const clear = (): void => {
    setDisplay('0');
    setPreviousValue(null);
    setOperation(null);
    setWaitingForOperand(false);
  };

  const clearEntry = (): void => {
    setDisplay('0');
  };

  const inputDecimal = (): void => {
    if (waitingForOperand) {
      setDisplay('0.');
      setWaitingForOperand(false);
    } else if (display.indexOf('.') === -1) {
      setDisplay(display + '.');
    }
  };

  return (
    <>
      {/* Botão Flutuante */}
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => setIsOpen(true)}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons
          name="calculator"
          size={28}
          color={Colors.light.textWhite}
        />
      </TouchableOpacity>

      {/* Modal da Calculadora */}
      <Modal
        visible={isOpen}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.calculatorContainer}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerContent}>
                <View style={styles.iconContainer}>
                  <MaterialCommunityIcons
                    name="calculator"
                    color={Colors.light.primary}
                    size={24}
                  />
                </View>
                <View style={styles.headerTextContainer}>
                  <Text style={styles.headerTitle}>
                    Calculadora
                  </Text>
                  <Text style={styles.headerSubtitle}>
                    Faça seus cálculos
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setIsOpen(false)}
                  style={styles.closeButton}
                >
                  <MaterialCommunityIcons
                    name="close"
                    size={24}
                    color={Colors.light.textWhite}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Display */}
            <View style={styles.displayContainer}>
              <Text style={styles.displayText} numberOfLines={1}>
                {display}
              </Text>
              {operation && (
                <Text style={styles.operationText}>
                  {previousValue} {operation}
                </Text>
              )}
            </View>

            {/* Botões */}
            <View style={styles.buttonsContainer}>
              {/* Linha 1 */}
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  onPress={clear}
                  style={[styles.button, styles.clearButton]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.buttonText, styles.clearButtonText]}>AC</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={clearEntry}
                  style={[styles.button, styles.clearButton]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.buttonText, styles.clearButtonText]}>CE</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => inputOperation('÷')}
                  style={[styles.button, styles.operatorButton]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.buttonText, styles.operatorButtonText]}>÷</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => inputOperation('×')}
                  style={[styles.button, styles.operatorButton]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.buttonText, styles.operatorButtonText]}>×</Text>
                </TouchableOpacity>
              </View>

              {/* Linha 2 */}
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  onPress={() => inputNumber(7)}
                  style={styles.button}
                  activeOpacity={0.7}
                >
                  <Text style={styles.buttonText}>7</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => inputNumber(8)}
                  style={styles.button}
                  activeOpacity={0.7}
                >
                  <Text style={styles.buttonText}>8</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => inputNumber(9)}
                  style={styles.button}
                  activeOpacity={0.7}
                >
                  <Text style={styles.buttonText}>9</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => inputOperation('-')}
                  style={[styles.button, styles.operatorButton]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.buttonText, styles.operatorButtonText]}>−</Text>
                </TouchableOpacity>
              </View>

              {/* Linha 3 */}
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  onPress={() => inputNumber(4)}
                  style={styles.button}
                  activeOpacity={0.7}
                >
                  <Text style={styles.buttonText}>4</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => inputNumber(5)}
                  style={styles.button}
                  activeOpacity={0.7}
                >
                  <Text style={styles.buttonText}>5</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => inputNumber(6)}
                  style={styles.button}
                  activeOpacity={0.7}
                >
                  <Text style={styles.buttonText}>6</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => inputOperation('+')}
                  style={[styles.button, styles.operatorButton]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.buttonText, styles.operatorButtonText]}>+</Text>
                </TouchableOpacity>
              </View>

              {/* Linha 4 */}
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  onPress={() => inputNumber(1)}
                  style={styles.button}
                  activeOpacity={0.7}
                >
                  <Text style={styles.buttonText}>1</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => inputNumber(2)}
                  style={styles.button}
                  activeOpacity={0.7}
                >
                  <Text style={styles.buttonText}>2</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => inputNumber(3)}
                  style={styles.button}
                  activeOpacity={0.7}
                >
                  <Text style={styles.buttonText}>3</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={performCalculation}
                  style={[styles.button, styles.equalsButton, styles.tallButton]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.buttonText, styles.equalsButtonText]}>=</Text>
                </TouchableOpacity>
              </View>

              {/* Linha 5 */}
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  onPress={() => inputNumber(0)}
                  style={[styles.button, styles.zeroButton]}
                  activeOpacity={0.7}
                >
                  <Text style={styles.buttonText}>0</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={inputDecimal}
                  style={styles.button}
                  activeOpacity={0.7}
                >
                  <Text style={styles.buttonText}>.</Text>
                </TouchableOpacity>
                <View style={styles.emptySpace} />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  calculatorContainer: {
    width: width * 0.9,
    maxWidth: 350,
    backgroundColor: Colors.light.background,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },

  header: {
    backgroundColor: Colors.light.primary,
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },

  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  iconContainer: {
    padding: 12,
    borderRadius: 16,
    backgroundColor: Colors.light.textWhite,
    marginRight: 16,
  },

  headerTextContainer: {
    flex: 1,
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light.textWhite,
    marginBottom: 2,
  },

  headerSubtitle: {
    fontSize: 12,
    color: Colors.light.textWhite,
    opacity: 0.9,
  },

  closeButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },

  displayContainer: {
    backgroundColor: Colors.light.cardBackground,
    paddingHorizontal: 24,
    paddingVertical: 20,
    marginTop: -20,
    marginHorizontal: 20,
    borderRadius: 16,
    minHeight: 80,
    justifyContent: 'flex-end',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },

  displayText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.light.text,
    textAlign: 'right',
  },

  operationText: {
    fontSize: 14,
    color: Colors.light.mutedText,
    textAlign: 'right',
    marginTop: 4,
  },

  buttonsContainer: {
    padding: 20,
  },

  buttonRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },

  button: {
    flex: 1,
    height: 56,
    marginHorizontal: 6,
    borderRadius: 16,
    backgroundColor: Colors.light.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },

  buttonText: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.light.text,
  },

  operatorButton: {
    backgroundColor: Colors.light.primary,
  },

  operatorButtonText: {
    color: Colors.light.textWhite,
    fontSize: 20,
  },

  equalsButton: {
    backgroundColor: Colors.light.accentBlue,
  },

  equalsButtonText: {
    color: Colors.light.textWhite,
    fontSize: 20,
  },

  clearButton: {
    backgroundColor: Colors.light.secondary,
  },

  clearButtonText: {
    color: Colors.light.textWhite,
    fontSize: 16,
    fontWeight: 'bold',
  },

  tallButton: {
    height: 124,
  },

  zeroButton: {
    flex: 2,
    marginRight: 6,
  },

  emptySpace: {
    flex: 1,
    marginHorizontal: 6,
  },
});

export default FloatingCalculator;