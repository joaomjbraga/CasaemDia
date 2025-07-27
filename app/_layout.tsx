import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: 'index',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { user, loading, initialized } = useAuth();
  const [lastNavigation, setLastNavigation] = useState<string | null>(null);

  useEffect(() => {
    if (!initialized || loading) return;

    const targetRoute = user ? '/(tabs)' : '/(auth)/login';
    if (lastNavigation !== targetRoute) {
      setLastNavigation(targetRoute);
      router.replace(targetRoute);
    }
  }, [user, initialized, loading]);

  if (!initialized || loading) {
    return (
      <SafeAreaProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <View
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: colorScheme === 'dark' ? '#000' : '#fff',
            }}
          >
            <ActivityIndicator size="large" color={colorScheme === 'dark' ? '#F4CE14' : '#3E8E7E'} />
            <Text
              style={{
                marginTop: 16,
                fontSize: 16,
                fontWeight: '500',
                color: colorScheme === 'dark' ? '#F4CE14' : '#3E8E7E',
              }}
            >
              Carregando...
            </Text>
          </View>
        </ThemeProvider>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'none',
          }}
        >
          <Stack.Screen
            name="(tabs)"
            options={{
              headerShown: false,
              gestureEnabled: false,
            }}
          />
          <Stack.Screen
            name="(auth)/login"
            options={{
              headerShown: false,
              gestureEnabled: false,
            }}
          />
          <Stack.Screen
            name="(auth)/register"
            options={{
              headerShown: false,
              gestureEnabled: false,
            }}
          />
          <Stack.Screen
            name="(auth)/forgot"
            options={{
              headerShown: false,
              gestureEnabled: false,
            }}
          />
        </Stack>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}