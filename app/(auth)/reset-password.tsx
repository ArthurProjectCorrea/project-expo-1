import * as React from 'react';
import { Stack } from 'expo-router';
import { View } from 'react-native';
import { ResetPasswordForm } from '@/components/reset-password-form';

export default function ResetPasswordScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Reset password' }} />
      <View className="flex-1 items-center justify-center p-4">
        <ResetPasswordForm />
      </View>
    </>
  );
}
