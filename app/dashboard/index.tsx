import * as React from 'react';
import { Stack, useRouter } from 'expo-router';
import { View, Alert } from 'react-native';
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

  function handleBarcodeScanned(event: any) {
    // prevenir chamadas duplicadas
    if (scanned) return;
    setScanned(true);

    const data = event?.data ?? event?.nativeEvent?.data ?? '';

    setScannerVisible(false);

    if (data) {
      setDialogTitle('Código escaneado');
      setDialogDescription(String(data));
    } else {
      setDialogTitle('Leitura falhou');
      setDialogDescription('Não foi possível extrair o código do leitor.');
    }

    setDialogOpen(true);

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
        <Button onPress={openScanner} variant="secondary">
          <Text>Abrir scanner</Text>
        </Button>

        <Button onPress={handleSignOut} variant="outline">
          <Text>Sign out</Text>
        </Button>

        {/* Botão flutuante de câmera (lado direito) */}
        <Button
          onPress={openScanner}
          size="icon"
          className="absolute bottom-8 right-6 z-50"
          aria-label="Abrir scanner de código">
          <Icon as={CameraIcon} className="text-primary-foreground" size={18} />
        </Button>
      </View>

      {/* Scanner overlay (in-app) */}
      {scannerVisible && (
        <View className="absolute inset-0 z-50 bg-black">
          <CameraView
            ref={(r) => (cameraRef.current = r)}
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
      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{dialogTitle}</AlertDialogTitle>
            <AlertDialogDescription>{dialogDescription}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onPress={() => setDialogOpen(false)}>
              <Text>Fechar</Text>
            </AlertDialogCancel>
            <AlertDialogAction onPress={() => setDialogOpen(false)}>
              <Text>OK</Text>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
