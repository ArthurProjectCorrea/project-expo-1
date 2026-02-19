import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// Use AsyncStorage on native; let the client use `localStorage` on web (do not force AsyncStorage there).
const authOptions: any = {
  autoRefreshToken: true,
  persistSession: true,
  detectSessionInUrl: false,
};

if (Platform.OS !== 'web') {
  authOptions.storage = AsyncStorage;
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: authOptions,
});
