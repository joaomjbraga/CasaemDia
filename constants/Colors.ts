// /constants/Colors.ts

const tintColorLight = '#A259FF'; // Roxo primário (ícones e elementos principais)
const tintColorDark = '#A259FF';

export default {
  light: {
    // Cores principais do background
    background: '#E6FBFF',         // Fundo principal azul claro
    backgroundSecondary: '#B8F2FF', // Fundo secundário azul mais intenso

    // Cores de texto
    text: '#1A1A1A',               // Texto principal escuro
    textWhite: '#FFFFFF',          // Texto branco
    mutedText: '#5E5E5E',          // Texto secundário

    // Cores primárias do design
    primary: tintColorLight,       // Roxo principal (#A259FF)
    tint: tintColorLight,          // Para compatibilidade com código existente
    secondary: '#FF6F61',          // Coral/salmão (não muito presente nas imagens)

    // Cores dos elementos ilustrativos
    illustrationPurple: '#8B5FBF',  // Roxo das roupas/elementos
    illustrationPink: '#FF69B4',    // Rosa vibrante das ilustrações
    illustrationCyan: '#00E5FF',    // Ciano dos elementos
    illustrationYellow: '#FFD700',  // Amarelo dos detalhes
    illustrationOrange: '#FF8C00',  // Laranja dos elementos
    illustrationTeal: '#20B2AA',    // Verde-azulado

    // Cores dos cartões e elementos UI
    cardBackground: '#FFFFFF',      // Fundo dos cartões brancos
    cardDark: '#2A2A2A',           // Cartões escuros (treinos sugeridos)
    cardDarkSecondary: '#1E1E1E',   // Cartões ainda mais escuros

    // Cores de destaque
    accentBlue: '#00C2FF',         // Azul piscina (gráficos)
    accentCyan: '#40E0D0',         // Ciano claro
    accentYellow: '#FFC300',       // Amarelo destaque

    // Cores funcionais
    border: '#E0E0E0',             // Bordas sutis
    borderLight: '#F0F0F0',        // Bordas mais claras
    success: '#34C759',            // Verde sucesso
    danger: '#FF3B30',             // Vermelho erro
    warning: '#FF9500',            // Laranja aviso

    // Cores específicas dos elementos
    progressBar: '#00C2FF',        // Cor da barra de progresso
    progressBackground: '#E0F7FF', // Fundo da barra de progresso
    buttonPrimary: '#A259FF',      // Botão primário
    buttonSecondary: '#40E0D0',    // Botão secundário

    // Cores dos ícones e elementos gráficos
    iconPrimary: '#A259FF',        // Ícones principais
    iconSecondary: '#00C2FF',      // Ícones secundários
    iconLight: '#FFFFFF',          // Ícones claros
    tabIconDefault: '#9E9E9E',     // Ícones de tab padrão
    tabIconSelected: tintColorLight, // Ícones de tab selecionados

    // Gradientes (caso precise)
    gradientStart: '#E6FBFF',      // Início do gradiente
    gradientEnd: '#B8F2FF',        // Fim do gradiente
  },
  dark: {
    // Mantendo o tema escuro similar, mas ajustado
    background: '#1A1A1A',         // Fundo escuro
    backgroundSecondary: '#2A2A2A', // Fundo secundário

    text: '#FFFFFF',               // Texto branco
    textWhite: '#FFFFFF',          // Texto branco
    textSecondary: '#E0E0E0',      // Texto secundário
    mutedText: '#9E9E9E',          // Texto esmaecido

    primary: tintColorDark,        // Roxo primário
    tint: tintColorDark,           // Para compatibilidade com código existente
    secondary: '#FF6F61',          // Coral

    // Adaptações das cores ilustrativas para tema escuro
    illustrationPurple: '#9D6FD1',
    illustrationPink: '#FF79C6',
    illustrationCyan: '#50FAFF',
    illustrationYellow: '#FFEB3B',
    illustrationOrange: '#FF9800',
    illustrationTeal: '#4DB6AC',

    cardBackground: '#2A2A2A',     // Cartões escuros
    cardDark: '#1E1E1E',           // Cartões mais escuros
    cardDarkSecondary: '#121212',   // Cartões ainda mais escuros

    accentBlue: '#00C2FF',
    accentCyan: '#40E0D0',
    accentYellow: '#FFC300',

    border: '#333333',
    borderLight: '#404040',
    success: '#30D158',
    danger: '#FF453A',
    warning: '#FF9F0A',

    progressBar: '#00C2FF',
    progressBackground: '#1A3A4A',
    buttonPrimary: '#A259FF',
    buttonSecondary: '#40E0D0',

    iconPrimary: '#A259FF',
    iconSecondary: '#00C2FF',
    iconLight: '#FFFFFF',
    tabIconDefault: '#6B7280',     // Ícones de tab padrão para tema escuro
    tabIconSelected: tintColorDark, // Ícones de tab selecionados

    gradientStart: '#1A1A1A',
    gradientEnd: '#2A2A2A',
  },
};