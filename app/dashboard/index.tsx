import * as React from 'react';
import { Stack, useRouter } from 'expo-router';
import { View, Alert, ScrollView, ActivityIndicator, Image } from 'react-native';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';

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

  // product result (image API)
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

  async function lookupCosmos(barcode: string) {
    // normalize scanned input and try sensible UPC/EAN variants
    const digits = String(barcode).replace(/\D/g, '');

    const buildCandidates = (d: string) => {
      const s = new Set<string>();
      if (!d) return [] as string[];

      if (d.length === 12) {
        s.add(d); // UPC-A
        s.add('0' + d); // EAN-13 representation
      } else if (d.length === 13) {
        if (d.startsWith('0')) {
          s.add(d.slice(1)); // map EAN-13 -> UPC-A
          s.add(d);
        } else {
          s.add(d); // keep EAN-13 (may be GTIN-13)
        }
      } else if (d.length === 11) {
        s.add(d);
        s.add('0' + d);
      } else if (d.length === 8) {
        s.add(d); // EAN-8
      } else {
        s.add(d);
        if (d.length < 12) s.add(d.padStart(12, '0'));
        if (!d.startsWith('0')) s.add('0' + d);
      }

      return Array.from(s);
    };

    // show dialog immediately
    setDialogTitle('Buscando imagem');
    setProductLoading(true);
    setProductError(null);
    setProductData(null);
    setDialogOpen(true);

    // setup abort controller so we can cancel
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    const candidates = buildCandidates(digits);
    console.debug('image-api lookup candidates for', barcode, '=>', candidates);

    let found = false;
    let lastError: any = null;

    try {
      for (const candidate of candidates) {
        // 1) always check local DB first
        setDialogDescription(`Verificando produto no banco local — ${candidate} ...`);

        try {
          const { data: dbProduct, error: dbError } = await supabase
            .from('products')
            .select('*')
            .eq('barcode', candidate)
            .maybeSingle();

          if (dbError) {
            console.warn('supabase select error', dbError);
          }

          if (dbProduct) {
            setProductData({
              images: dbProduct.image_url ? [dbProduct.image_url] : [],
              title: dbProduct.name,
              brand: dbProduct.brand ?? null,
              description: dbProduct.description ?? null,
              lowest_recorded_price: null,
              currency: null,
              raw: dbProduct,
            });

            setDialogTitle('Produto encontrado (local)');
            setDialogDescription(`Encontrado na base local: ${candidate}`);
            found = true;
            break;
          }
        } catch (err: any) {
          console.warn('Erro ao consultar products no Supabase', err);
        }

        // 2) not in DB — query Cosmos and insert into DB if found
        setDialogDescription(`Consultando Cosmos — tentando: ${candidate} ...`);

        // prefer real Cosmos API when token/user-agent are provided, otherwise use a development mock
        const COSMOS_TOKEN = process.env.EXPO_PUBLIC_COSMOS_TOKEN;
        const COSMOS_USER_AGENT = process.env.EXPO_PUBLIC_COSMOS_USER_AGENT ?? 'project-expo-1';

        if (!COSMOS_TOKEN) {
          console.warn(
            'EXPO_PUBLIC_COSMOS_TOKEN não definido — usando mock de desenvolvimento para',
            candidate
          );
          setProductData({
            images: [`https://via.placeholder.com/160?text=${candidate}`],
            title: `Produto mock ${candidate}`,
            brand: 'MOCK-Brand',
            description: 'Resposta mock — defina EXPO_PUBLIC_COSMOS_TOKEN para usar a API real',
            lowest_recorded_price: 'R$ 0,00',
            currency: 'BRL',
            raw: { mock: true, gtin: candidate },
          });

          setDialogTitle('Produto (mock) encontrado');
          setDialogDescription(
            `Mock para: ${candidate} (escaneado: ${digits}) — configure EXPO_PUBLIC_COSMOS_TOKEN`
          );
          found = true;
          break;
        }

        try {
          const url = `https://api.cosmos.bluesoft.com.br/gtins/${encodeURIComponent(candidate)}.json`;
          const res = await fetch(url, {
            signal,
            headers: {
              'Content-Type': 'application/json',
              'X-Cosmos-Token': COSMOS_TOKEN,
              'User-Agent': COSMOS_USER_AGENT,
            },
          });

          if (res.status === 404) {
            // produto não encontrado — tentar próximo candidato
            continue;
          }

          if (res.status === 401 || res.status === 403) {
            setProductError('Autenticação Cosmos falhou — verifique X-Cosmos-Token / User-Agent');
            setDialogTitle('Autenticação falhou');
            setDialogDescription('Token inválido ou User-Agent ausente.');
            return;
          }

          if (res.status === 429) {
            setProductError('Limite de requisições atingido (Cosmos)');
            setDialogTitle('Limite de requisições');
            setDialogDescription('Tente novamente mais tarde.');
            return;
          }

          if (!res.ok) throw new Error(`HTTP ${res.status}`);

          const json = await res.json();

          // map Cosmos response into product-like object
          const images: string[] = [];
          if (json.thumbnail) images.push(String(json.thumbnail));
          if (Array.isArray(json.images) && json.images.length)
            images.push(...json.images.map(String));

          const mapped = {
            barcode: candidate,
            name: json.description ?? json.title ?? 'Sem nome',
            brand: json.brand?.name ?? null,
            image_url: images[0] ?? null,
            category: json.gpc?.description ?? null,
            description: json.description ?? null,
            source: 'api',
            raw: json,
          } as any;

          // insert into Supabase products
          try {
            const { data: inserted, error: insertError } = await supabase
              .from('products')
              .insert({
                barcode: mapped.barcode,
                name: mapped.name,
                brand: mapped.brand,
                image_url: mapped.image_url,
                category: mapped.category,
                source: 'api',
                description: mapped.description,
              })
              .select()
              .maybeSingle();

            if (insertError) {
              // possible race/unique constraint — fetch existing
              console.warn('Erro ao inserir product no Supabase', insertError);
              const { data: existing } = await supabase
                .from('products')
                .select('*')
                .eq('barcode', candidate)
                .maybeSingle();
              setProductData({
                images: existing?.image_url ? [existing.image_url] : images,
                title: existing?.name ?? mapped.name,
                brand: existing?.brand ?? mapped.brand,
                description: existing?.description ?? mapped.description,
                lowest_recorded_price: null,
                currency: null,
                raw: existing ?? mapped.raw,
              });
            } else {
              setProductData({
                images: images,
                title: inserted?.name ?? mapped.name,
                brand: inserted?.brand ?? mapped.brand,
                description: inserted?.description ?? mapped.description,
                lowest_recorded_price: null,
                currency: null,
                raw: inserted ?? mapped.raw,
              });
            }
          } catch (dbErr: any) {
            console.warn('unexpected DB error while inserting product', dbErr);
            setProductData({
              images: images,
              title: mapped.name,
              brand: mapped.brand,
              description: mapped.description,
              raw: mapped.raw,
            });
          }

          setDialogTitle('Produto encontrado (API)');
          setDialogDescription(`Código consultado: ${candidate} (escaneado: ${digits})`);
          found = true;
          break;
        } catch (err: any) {
          lastError = err;
          if (err?.name === 'AbortError') throw err;
          console.warn('Cosmos lookup error', candidate, err);
          // tentar próximo candidato
        }
      }

      if (!found) {
        setProductError('Produto não encontrado na API Cosmos');
        setDialogTitle('Produto não encontrado');
        setDialogDescription(`Escaneado: ${digits}`);
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        setProductError('Consulta cancelada pelo usuário');
        setDialogTitle('Consulta cancelada');
        setDialogDescription('Você cancelou a pesquisa.');
      } else {
        setProductError(err?.message ?? String(err) ?? String(lastError ?? ''));
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

    // show raw scanned value (helpful for debugging) and then lookup
    console.debug('Barcode scanned (raw):', data);
    setDialogTitle('Buscando imagem');
    setDialogDescription(`Escaneado: ${String(data)} — consultando Cosmos...`);
    setDialogOpen(true);

    void lookupCosmos(String(data));

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
              <Text>Buscando dados no Cosmos…</Text>
            </View>
          )}

          {productError && (
            <View className="p-4">
              <Text className="text-destructive">{productError}</Text>
            </View>
          )}

          {productData && (
            <View className="p-2">
              <View className="flex-row items-start gap-4">
                {productData.images?.[0] ? (
                  <Image
                    source={{ uri: productData.images[0] }}
                    style={{ width: 84, height: 84, borderRadius: 8 }}
                  />
                ) : (
                  <View
                    style={{
                      width: 84,
                      height: 84,
                      borderRadius: 8,
                      backgroundColor: '#F3F4F6',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                    <Text className="text-xs text-muted-foreground">Sem imagem</Text>
                  </View>
                )}

                <View style={{ flex: 1 }}>
                  <Text className="font-medium">{productData.title ?? '—'}</Text>
                  <Text className="text-sm text-muted-foreground">
                    {[productData.brand, productData.model].filter(Boolean).join(' • ')}
                  </Text>
                  {productData.description ? (
                    <Text className="mt-2 text-sm">{productData.description}</Text>
                  ) : null}
                  {productData.category ? (
                    <Text className="mt-2 text-xs">{productData.category}</Text>
                  ) : null}
                  {productData.lowest_recorded_price ? (
                    <Text className="mt-2 text-sm">
                      Preço mínimo: {productData.lowest_recorded_price} {productData.currency ?? ''}
                    </Text>
                  ) : null}
                </View>
              </View>

              <View className="mt-3">
                <ScrollView style={{ maxHeight: 220 }}>
                  <Text variant="code">{JSON.stringify(productData, null, 2)}</Text>
                </ScrollView>
              </View>
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
