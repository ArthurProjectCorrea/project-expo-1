import * as React from 'react';
import { Stack } from 'expo-router';
import { View } from 'react-native';
import { SignInForm } from '@/components/sign-in-form';

export default function SignInScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Sign in' }} />
      <View className="flex-1 items-center justify-center p-4">
        <SignInForm />
      </View>
    </>
  );
}
