import React from 'react';
import '@/global.css';
import { NAV_THEME } from '@/lib/theme';
import { ThemeProvider } from '@react-navigation/native';
import { PortalHost } from '@rn-primitives/portal';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'nativewind';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LogBox } from 'react-native';

// Suppress deprecation noise from libs that still reference the RN SafeAreaView
// (we use `react-native-safe-area-context` throughout the app).
LogBox.ignoreLogs([
  "SafeAreaView has been deprecated and will be removed in a future release. Please use 'react-native-safe-area-context' instead.",
]);

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export default function RootLayout() {
  const { colorScheme } = useColorScheme();

  return (
    <ThemeProvider value={NAV_THEME[colorScheme ?? 'light']}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <AuthProvider>
        <SafeAreaProvider>
          <AuthGate>
            <Stack />
          </AuthGate>
        </SafeAreaProvider>
      </AuthProvider>
      <PortalHost />
    </ThemeProvider>
  );
}

function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  React.useEffect(() => {
    if (loading) return;

    const inAuthRoute = segments[0] === '(auth)';
    const authChild = segments[1] ?? '';

    if (!user || !user.email_confirmed_at) {
      // user not authenticated/confirmed → force to auth flow
      if (!inAuthRoute) router.replace('sign-in' as any);
      return;
    }

    // user authenticated and confirmed → prevent access to most auth routes
    // allow `verify-email` and `reset-password` so the recovery flow (verify -> reset) can complete
    if (inAuthRoute && !['verify-email', 'reset-password'].includes(authChild)) {
      router.replace('dashboard' as any);
    }
  }, [user, loading, segments, router]);

  // while auth state is resolving keep layout empty (prevents flicker)
  if (loading) return null;

  return <>{children}</>;
}
