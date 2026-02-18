import * as React from 'react';
import { Stack, useRouter } from 'expo-router';
import { View, Alert } from 'react-native';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/context/AuthContext';

export default function DashboardScreen() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!loading && (!user || !user.email_confirmed_at)) {
      router.replace('sign-in' as any);
    }
  }, [user, loading, router]);

  async function handleSignOut() {
    try {
      await signOut();
    } catch (err: any) {
      Alert.alert('Erro ao sair', err?.message ?? String(err));
    }
  }

  if (loading) return null;

  return (
    <>
      <Stack.Screen options={{ title: 'Home' }} />
      <View className="flex-1 items-center justify-center gap-4 p-4">
        <Text className="text-lg">Welcome</Text>
        <Text className="text-sm text-muted-foreground">{user?.email}</Text>
        <Button onPress={handleSignOut} variant="outline">
          <Text>Sign out</Text>
        </Button>
      </View>
    </>
  );
}
