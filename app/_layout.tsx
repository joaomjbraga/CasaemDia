import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { FamilyMembersProvider } from "@/contexts/FamilyMembersContext";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import {
  DefaultTheme,
  ThemeProvider as NavigationThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack, router, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Colors from "../constants/Colors";

export { ErrorBoundary } from "expo-router";

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
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

function useProtectedRoute() {
  const segments = useSegments();
  const { user, session, initialized } = useAuth();

  useEffect(() => {
    if (!initialized) return;

    const inAuthGroup = segments[0] === "(auth)";
    const isAuthenticated = user && session && user.email;

    console.log("Route protection check:", {
      segments: segments.join("/"),
      inAuthGroup,
      isAuthenticated,
      userEmail: user?.email,
    });

    if (!isAuthenticated && !inAuthGroup) {
      // User is not authenticated but trying to access protected route
      console.log("Redirecting unauthenticated user to login");
      router.replace("/(auth)/login");
    } else if (isAuthenticated && inAuthGroup) {
      // User is authenticated but on auth screen
      console.log("Redirecting authenticated user to tabs");
      router.replace("/(tabs)");
    }
  }, [user, session, initialized, segments]);
}

function RootLayoutNav() {
  const { user, session, loading, initialized } = useAuth();
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useProtectedRoute();

  useEffect(() => {
    if (initialized && !loading) {
      // Small delay to prevent flash
      const timer = setTimeout(() => {
        setIsInitialLoad(false);
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [initialized, loading]);

  // Show loading screen during initialization
  if (!initialized || loading || isInitialLoad) {
    return (
      <SafeAreaProvider>
        <NavigationThemeProvider value={DefaultTheme}>
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: "#fff",
            }}
          >
            <ActivityIndicator size="large" color={Colors.light.primary} />
            <Text
              style={{
                marginTop: 16,
                fontSize: 16,
                fontWeight: "500",
                color: Colors.light.secondary,
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
            animation: "slide_from_right",
          }}
        >
          {/* Protected routes - only accessible when authenticated */}
          <Stack.Screen
            name="(tabs)"
            options={{
              headerShown: false,
              gestureEnabled: false,
            }}
          />

          {/* Auth routes - only accessible when not authenticated */}
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

          {/* Settings can be accessed by authenticated users */}
          <Stack.Screen
            name="settings"
            options={{
              headerShown: false,
              gestureEnabled: true,
              presentation: "modal",
            }}
          />
        </Stack>
      </NavigationThemeProvider>
    </SafeAreaProvider>
  );
}
