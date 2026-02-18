import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import { View, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { AuthContext } from '@/context/AuthContext';

export function ForgotPasswordForm() {
  const [email, setEmail] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const { sendPasswordResetOtp } = React.useContext(AuthContext);
  const router = useRouter();

  async function onSubmit() {
    if (!email) {
      Alert.alert('Informe o email');
      return;
    }
    setLoading(true);
    try {
      const { error } = await sendPasswordResetOtp(email);
      if (error) {
        Alert.alert('Erro ao enviar código', error.message);
        return;
      }
      Alert.alert('Enviado', 'Código enviado para o e‑mail informado');
      router.push(`verify-email?email=${encodeURIComponent(email)}&purpose=recovery` as any);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View className="gap-6">
      <Card className="border-border/0 shadow-none sm:border-border sm:shadow-sm sm:shadow-black/5">
        <CardHeader>
          <CardTitle className="text-center text-xl sm:text-left">Forgot password?</CardTitle>
          <CardDescription className="text-center sm:text-left">
            Enter your email to reset your password
          </CardDescription>
        </CardHeader>
        <CardContent className="gap-6">
          <View className="gap-6">
            <View className="gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                placeholder="m@example.com"
                keyboardType="email-address"
                autoComplete="email"
                autoCapitalize="none"
                returnKeyType="send"
                value={email}
                onChangeText={setEmail}
                onSubmitEditing={onSubmit}
              />
            </View>
            <Button className="w-full" onPress={onSubmit} disabled={loading}>
              <Text>{loading ? 'Sending…' : 'Reset your password'}</Text>
            </Button>
          </View>
        </CardContent>
      </Card>
    </View>
  );
}
