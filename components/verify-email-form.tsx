import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import * as React from 'react';
import { type TextStyle, View, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { AuthContext } from '@/context/AuthContext';

const RESEND_CODE_INTERVAL_SECONDS = 30;

const TABULAR_NUMBERS_STYLE: TextStyle = { fontVariant: ['tabular-nums'] };

export function VerifyEmailForm({
  email: initialEmail,
  purpose = 'signup',
}: { email?: string; purpose?: 'signup' | 'recovery' } = {}) {
  const { countdown, restartCountdown } = useCountdown(RESEND_CODE_INTERVAL_SECONDS);
  const params = useLocalSearchParams();
  const router = useRouter();
  const { verifyOtp, sendOtp, sendPasswordResetOtp } = React.useContext(AuthContext);

  const email = initialEmail ?? (params.email as string) ?? '';
  const [code, setCode] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  async function onSubmit() {
    if (!email || !code) {
      Alert.alert('Informe o email e o código');
      return;
    }

    setLoading(true);
    try {
      if (purpose === 'recovery') {
        const { data, error } = await verifyOtp(email, code, 'recovery');
        if (error) {
          Alert.alert('Código inválido', error.message);
          return;
        }

        // Código válido para recuperação — avance para a tela de nova senha.
        Alert.alert('Verificado', 'Código confirmado — defina sua nova senha.');
        router.replace('reset-password' as any);
        return;
      }

      const { data, error } = await verifyOtp(email, code);
      if (error) {
        // exemplos de erros: token inválido/expirado, já usado
        Alert.alert('Código inválido', error.message);
        return;
      }

      // Sucesso (confirmação de e-mail). Supabase normalmente cria sessão automaticamente.
      if (data?.session) {
        router.replace('dashboard' as any);
        return;
      }

      Alert.alert('Verificado', 'Código confirmado — entrando...');
      router.replace('dashboard' as any);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View className="gap-6">
      <Card className="border-border/0 pb-4 shadow-none sm:border-border sm:shadow-sm sm:shadow-black/5">
        <CardHeader>
          <CardTitle className="text-center text-xl sm:text-left">
            {purpose === 'recovery' ? 'Reset your password' : 'Verify your email'}
          </CardTitle>
          <CardDescription className="text-center sm:text-left">
            {purpose === 'recovery'
              ? `Enter the reset code sent to ${email || 'your email'}`
              : `Enter the verification code sent to ${email || 'your email'}`}
          </CardDescription>
        </CardHeader>
        <CardContent className="gap-6">
          <View className="gap-6">
            <View className="gap-1.5">
              <Label htmlFor="code">Verification code</Label>
              <Input
                id="code"
                autoCapitalize="none"
                returnKeyType="send"
                keyboardType="numeric"
                autoComplete="sms-otp"
                textContentType="oneTimeCode"
                value={code}
                onChangeText={setCode}
                onSubmitEditing={onSubmit}
              />
              <Button
                variant="link"
                size="sm"
                disabled={countdown > 0}
                onPress={async () => {
                  if (!email) {
                    Alert.alert('Email ausente');
                    return;
                  }
                  const { error } =
                    purpose === 'recovery'
                      ? await sendPasswordResetOtp(email)
                      : await sendOtp(email);
                  if (error) {
                    Alert.alert('Erro ao reenviar', error.message);
                    return;
                  }
                  restartCountdown();
                }}>
                <Text className="text-center text-xs">
                  Didn&apos;t receive the code? Resend{' '}
                  {countdown > 0 ? (
                    <Text className="text-xs" style={TABULAR_NUMBERS_STYLE}>
                      ({countdown})
                    </Text>
                  ) : null}
                </Text>
              </Button>
            </View>
            <View className="gap-3">
              <Button className="w-full" onPress={onSubmit} disabled={loading}>
                <Text>{loading ? 'Verifying…' : 'Continue'}</Text>
              </Button>
              <Button
                variant="link"
                className="mx-auto"
                onPress={() => {
                  router.push('sign-in' as any);
                }}>
                <Text>Cancel</Text>
              </Button>
            </View>
          </View>
        </CardContent>
      </Card>
    </View>
  );
}

function useCountdown(seconds = 30) {
  const [countdown, setCountdown] = React.useState(seconds);
  const intervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  const startCountdown = React.useCallback(() => {
    setCountdown(seconds);

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [seconds]);

  React.useEffect(() => {
    startCountdown();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [startCountdown]);

  return { countdown, restartCountdown: startCountdown };
}
