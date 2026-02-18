import { Slot, useRouter, useSegments } from 'expo-router';
import * as React from 'react';
import { useAuth } from '@/context/AuthContext';

export default function AuthLayout() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const authChild = segments[1] ?? '';

  React.useEffect(() => {
    if (!loading && user?.email_confirmed_at) {
      // allow the verification/recovery flows to complete inside the auth group
      if (!['verify-email', 'reset-password'].includes(authChild)) {
        router.replace('dashboard' as any);
      }
    }
  }, [user, loading, router, authChild]);

  if (loading) return null;

  return <Slot />;
}
