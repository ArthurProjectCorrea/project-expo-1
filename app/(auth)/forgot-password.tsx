import * as React from 'react';
import { Stack } from 'expo-router';
import { View } from 'react-native';
import { ForgotPasswordForm } from '@/components/forgot-password-form';

export default function ForgotPasswordScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Forgot password' }} />
      <View className="flex-1 items-center justify-center p-4">
        <ForgotPasswordForm />
      </View>
    </>
  );
}
