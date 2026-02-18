import * as React from 'react';
import { Stack } from 'expo-router';
import { View } from 'react-native';
import { SignUpForm } from '@/components/sign-up-form';

export default function SignUpScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Create account' }} />
      <View className="flex-1 items-center justify-center p-4">
        <SignUpForm />
      </View>
    </>
  );
}
