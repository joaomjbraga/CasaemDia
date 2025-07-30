import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { FamilyMembersProvider } from '@/contexts/FamilyMembersContext';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Colors from '../constants/Colors';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)', // Corrigido para apontar para o grupo (tabs)
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
      <FamilyMembersProvider>
        <RootLayoutNav />
      </FamilyMembersProvider>
    </AuthProvider>
  );
}

function RootLayoutNav() {
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
        <NavigationThemeProvider value={DefaultTheme}>
          <View
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: Colors.light.backgroundSecondary, // Usa Colors.light
            }}
          >
            <ActivityIndicator
              size="large"
              color={Colors.light.primary} // Usa Colors.light
            />
            <Text
              style={{
                marginTop: 16,
                fontSize: 16,
                fontWeight: '500',
                color: Colors.light.secondary, // Usa Colors.light
              }}
            >
              Carregando...
            </Text>
          </View>
        </NavigationThemeProvider>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationThemeProvider value={DefaultTheme}>
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
          <Stack.Screen
            name="settings"
            options={{
              headerShown: false,
              gestureEnabled: false,
            }}
          />
        </Stack>
      </NavigationThemeProvider>
    </SafeAreaProvider>
  );
}