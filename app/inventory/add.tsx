import * as React from 'react';
import { View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/context/AuthContext';
import { addUserInventory } from '@/lib/userInventory';

export default function InventoryAddPage() {
  const { session, loading } = useAuth();
  const params = useLocalSearchParams();
  const router = useRouter();

  const productId = (params.productId ?? params.product_id ?? params.product) as string | undefined;
  const rawQuantity = (params.quantity ?? params.q) as string | undefined;
  const expiration = (params.expiration_date ?? params.expiration ?? params.exp) as
    | string
    | undefined;

  const [status, setStatus] = React.useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (loading) return;
    (async () => {
      if (!session?.user?.id) {
        setStatus('error');
        setMessage('Usuário não autenticado');
        return;
      }

      if (!productId) {
        setStatus('error');
        setMessage('Parâmetro `productId` ausente');
        return;
      }

      setStatus('loading');

      try {
        const q = Math.max(1, Number(rawQuantity ?? 1));
        await addUserInventory({
          userId: session.user.id,
          productId,
          quantity: q,
          expirationDate: expiration ?? null,
        });

        setStatus('success');
        setMessage('Registro criado com sucesso. Verifique a tabela `user_inventory`.');

        // optional: voltar automaticamente após curto período
        setTimeout(() => router.replace('/dashboard' as any), 900);
      } catch (err: any) {
        setStatus('error');
        setMessage(err?.message ?? String(err));
      }
    })();
  }, [loading, session, productId, rawQuantity, expiration, router]);

  return (
    <>
      <Stack.Screen options={{ title: 'Adicionar ao estoque' }} />
      <View className="flex-1 items-center justify-center p-4">
        <Text className="mb-4">
          {status === 'loading' && 'Adicionando ao estoque...'}
          {status === 'success' && '✅ Sucesso — '}
          {status === 'error' && '⚠️ Erro — '}
        </Text>
        <Text>{message ?? 'Aguardando...'}</Text>
      </View>
    </>
  );
}
