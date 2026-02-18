import * as React from 'react';
import { Stack, useRouter } from 'expo-router';
import { View, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/context/AuthContext';

// expo-camera (usando docs em docs/expo/camera.md)
import { CameraView } from 'expo-camera';
import { useCameraPermissions } from 'expo-camera';

// ícones
import { Camera as CameraIcon, X as XIcon } from 'lucide-react-native';
import { Icon } from '@/components/ui/icon';

// AlertDialog UI
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';

export default function DashboardScreen() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

  const [permission, requestPermission] = useCameraPermissions();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [dialogTitle, setDialogTitle] = React.useState('');
  const [dialogDescription, setDialogDescription] = React.useState('');

  // scanner in-app (fallback for Expo Go) using Camera component
  const [scannerVisible, setScannerVisible] = React.useState(false);
  const [scanned, setScanned] = React.useState(false);
  const cameraRef = React.useRef<any>(null);
  const abortControllerRef = React.useRef<AbortController | null>(null);

  // OpenFoodFacts result
  const [productData, setProductData] = React.useState<any | null>(null);
  const [productLoading, setProductLoading] = React.useState(false);
  const [productError, setProductError] = React.useState<string | null>(null);

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

  async function openScanner() {
    // solicitar permissão se ainda não concedida
    if (!permission || permission.status !== 'granted') {
      const res = await requestPermission();
      if (!res.granted) {
        setDialogTitle('Permissão de Câmera');
        setDialogDescription('Permissão de câmera negada — habilite para escanear códigos.');
        setDialogOpen(true);
        return;
      }
    }

    // abrir sobreposição com <Camera /> (fallback para Expo Go)
    setScanned(false);
    setScannerVisible(true);
  }

  async function lookupOpenFoodFacts(barcode: string) {
    // show dialog immediately and start loading
    setDialogTitle('Buscando produto');
    setDialogDescription(`Consultando Open Food Facts para ${barcode}...`);
    setProductLoading(true);
    setProductError(null);
    setProductData(null);
    setDialogOpen(true);

    // setup abort controller so we can cancel
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`, {
        signal,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();

      if (json?.status === 1) {
        setProductData(json);
        setDialogTitle('Produto encontrado');
        setDialogDescription(`Código: ${barcode}`);
      } else {
        setProductError('Produto não encontrado no Open Food Facts');
        setDialogTitle('Produto não encontrado');
        setDialogDescription(`Código: ${barcode}`);
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        setProductError('Consulta cancelada pelo usuário');
        setDialogTitle('Consulta cancelada');
        setDialogDescription('Você cancelou a pesquisa.');
      } else {
        setProductError(err?.message ?? String(err));
        setDialogTitle('Erro ao consultar API');
        setDialogDescription(String(err?.message ?? err));
      }
    } finally {
      setProductLoading(false);
      abortControllerRef.current = null;
    }
  }

  function handleBarcodeScanned(event: any) {
    // prevenir chamadas duplicadas
    if (scanned) return;
    setScanned(true);

    const data = event?.data ?? event?.nativeEvent?.data ?? '';

    setScannerVisible(false);

    if (!data) {
      setDialogTitle('Leitura falhou');
      setDialogDescription('Não foi possível extrair o código do leitor.');
      setDialogOpen(true);
      setTimeout(() => setScanned(false), 1000);
      return;
    }

    // mostrar imediatamente diálogo com spinner e consultar Open Food Facts
    void lookupOpenFoodFacts(String(data));

    // resetar flag depois de curto período (segurança)
    setTimeout(() => setScanned(false), 1000);
  }

  if (loading) return null;

  return (
    <>
      <Stack.Screen options={{ title: 'Home' }} />

      <View className="flex-1 items-center justify-center gap-4 p-4">
        <Text className="text-lg">Welcome</Text>
        <Text className="text-sm text-muted-foreground">{user?.email}</Text>

        {/* botão padrão (visível) para testes */}
        <Button onPress={openScanner} variant="secondary" disabled={productLoading}>
          <Text>Abrir scanner</Text>
        </Button>

        <Button onPress={handleSignOut} variant="outline" disabled={productLoading}>
          <Text>Sign out</Text>
        </Button>

        {/* Botão flutuante de câmera (lado direito) */}
        <Button
          onPress={openScanner}
          size="icon"
          className="absolute bottom-8 right-6 z-50"
          aria-label="Abrir scanner de código"
          disabled={productLoading}>
          <Icon as={CameraIcon} className="text-primary-foreground" size={18} />
        </Button>
      </View>

      {/* Scanner overlay (in-app) */}
      {scannerVisible && (
        <View className="absolute inset-0 z-50 bg-black">
          <CameraView
            ref={(r) => {
              cameraRef.current = r;
            }}
            style={{ flex: 1 }}
            onBarcodeScanned={handleBarcodeScanned}
          />

          {/* close button */}
          <View className="absolute right-4 top-8">
            <Button size="icon" variant="ghost" onPress={() => setScannerVisible(false)}>
              <Icon as={XIcon} size={18} />
            </Button>
          </View>

          <View className="absolute bottom-20 left-0 right-0 items-center">
            <Text className="text-white">Aponte a câmera para o código</Text>
          </View>
        </View>
      )}

      {/* AlertDialog para mostrar sucesso / erro */}
      <AlertDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setProductData(null);
            setProductError(null);
            setDialogDescription('');
            setDialogTitle('');
          }
        }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{dialogTitle}</AlertDialogTitle>
            <AlertDialogDescription>{dialogDescription}</AlertDialogDescription>
          </AlertDialogHeader>

          {/* corpo do diálogo: loading / erro / json */}
          {productLoading && (
            <View className="items-center gap-4 p-4">
              <ActivityIndicator size="large" color="#2563EB" />
              <Text>Buscando dados no Open Food Facts…</Text>
            </View>
          )}

          {productError && (
            <View className="p-4">
              <Text className="text-destructive">{productError}</Text>
            </View>
          )}

          {productData && (
            <View className="p-2">
              <ScrollView style={{ maxHeight: 340 }}>
                <Text variant="code">{JSON.stringify(productData, null, 2)}</Text>
              </ScrollView>
            </View>
          )}

          <AlertDialogFooter>
            {productLoading ? (
              // enquanto consulta estiver ativa mostramos botão para cancelar
              <Button
                variant="destructive"
                onPress={() => {
                  // abortar fetch em andamento
                  if (abortControllerRef.current) abortControllerRef.current.abort();
                }}>
                <Text>Cancelar consulta</Text>
              </Button>
            ) : null}

            <AlertDialogCancel
              onPress={() => {
                // não permitir fechar enquanto está carregando
                if (productLoading) return;
                setDialogOpen(false);
              }}>
              <Text>Fechar</Text>
            </AlertDialogCancel>

            <AlertDialogAction
              onPress={() => {
                if (productLoading) return;
                setDialogOpen(false);
              }}>
              <Text>OK</Text>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
