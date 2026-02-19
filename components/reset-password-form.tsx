import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import * as React from 'react';
import { View, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { AuthContext } from '@/context/AuthContext';

export function ResetPasswordForm() {
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const { updatePassword } = React.useContext(AuthContext);
  const router = useRouter();

  async function onSubmit() {
    if (!password) {
      Alert.alert('Informe a nova senha');
      return;
    }
    setLoading(true);
    try {
      const { error } = await updatePassword(password);
      if (error) {
        Alert.alert('Erro', error.message);
        return;
      }
      Alert.alert('Senha redefinida', 'Você foi autenticado com a nova senha.');
      router.replace('dashboard' as any);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View className="gap-6">
      <Card className="border-border/0 shadow-none sm:border-border sm:shadow-sm sm:shadow-black/5">
        <CardHeader>
          <CardTitle className="text-center text-xl sm:text-left">Reset password</CardTitle>
          <CardDescription className="text-center sm:text-left">
            Choose a new password for your account
          </CardDescription>
        </CardHeader>
        <CardContent className="gap-6">
          <View className="gap-6">
            <View className="gap-1.5">
              <View className="flex-row items-center">
                <Label htmlFor="password">New password</Label>
              </View>
              <Input
                id="password"
                secureTextEntry
                returnKeyType="send"
                value={password}
                onChangeText={setPassword}
                onSubmitEditing={onSubmit}
              />
            </View>
            <Button className="w-full" onPress={onSubmit} disabled={loading}>
              <Text>{loading ? 'Updating…' : 'Reset Password'}</Text>
            </Button>
          </View>
        </CardContent>
      </Card>
    </View>
  );
}
