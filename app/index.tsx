import * as React from 'react';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '@/context/AuthContext';

// Root now redirects to authentication first. The original public landing was removed
// to force users to sign in before accessing the app.
export default function IndexRedirect() {
  const { user, loading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (loading) return;
    if (user && user.email_confirmed_at) {
      router.replace('dashboard' as any);
    } else {
      router.replace('sign-in' as any);
    }
  }, [user, loading, router]);

  return (
    <View className="flex-1 items-center justify-center">
      <ActivityIndicator size="large" />
    </View>
  );
}
