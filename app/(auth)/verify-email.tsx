import * as React from 'react';
import { Stack, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { VerifyEmailForm } from '@/components/verify-email-form';

export default function VerifyEmailScreen() {
  const params = useLocalSearchParams();
  const email = (params.email as string) ?? undefined;
  const purpose = (params.purpose as string) ?? 'signup';

  return (
    <>
      <Stack.Screen
        options={{ title: purpose === 'recovery' ? 'Verify reset code' : 'Verify email' }}
      />
      <View className="flex-1 items-center justify-center p-4">
        <VerifyEmailForm email={email} purpose={purpose as 'signup' | 'recovery'} />
      </View>
    </>
  );
}
