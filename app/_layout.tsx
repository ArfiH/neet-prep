import { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { AuthProvider, useAuth } from '@/lib/authContext';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { COLORS } from '@/constants/colors';
import * as Linking from 'expo-linking';
import { initAdMob } from '@/lib/adService';

function AuthRouter() {
  const { loading, initialized, isLoggedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (initialized && !loading && !isLoggedIn) {
      router.replace('/login');
    }
  }, [initialized, loading, isLoggedIn]);

  useEffect(() => {
    const handleDeepLink = async (event: { url: string }) => {
      const url = event.url;
      console.log('Deep link received:', url);
      
      try {
        const parsed = Linking.parse(url);
        console.log('Parsed deep link:', parsed);
        
        if (parsed.path === 'reset-password' && parsed.queryParams?.token) {
          const token = parsed.queryParams.token as string;
          router.replace({
            pathname: '/reset-password',
            params: { token }
          });
        }

        if (parsed.path === 'verify-email' && parsed.queryParams?.token) {
          const token = parsed.queryParams.token as string;
          router.replace({
            pathname: '/verify-email',
            params: { token }
          });
        }
      } catch (e) {
        console.error('Error parsing deep link:', e);
      }
    };

    // Get initial URL if app was launched from deep link
    Linking.getInitialURL().then(url => {
      if (url) {
        console.log('Initial URL:', url);
        const parsed = Linking.parse(url);
        if (parsed.path === 'reset-password' && parsed.queryParams?.token) {
          const token = parsed.queryParams.token as string;
          router.replace({
            pathname: '/reset-password',
            params: { token }
          });
        }

        if (parsed.path === 'verify-email' && parsed.queryParams?.token) {
          const token = parsed.queryParams.token as string;
          router.replace({
            pathname: '/verify-email',
            params: { token }
          });
        }
      }
    }).catch(e => console.error('Error getting initial URL:', e));

    const subscription = Linking.addEventListener('url', handleDeepLink);
    return () => subscription.remove();
  }, [router]);

  if (loading || !initialized) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!isLoggedIn) {
    return (
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="verify-email" />
        <Stack.Screen name="forgot-password" />
        <Stack.Screen name="reset-password" />
        <Stack.Screen name="+not-found" />
      </Stack>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="register" />
      <Stack.Screen name="verify-email" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="reset-password" />
      <Stack.Screen name="set-target" />
      <Stack.Screen name="pdf/[id]" />
      <Stack.Screen name="pdf/viewer/[id]" />
      <Stack.Screen name="college/[id]" />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

export default function RootLayout() {
  useFrameworkReady();

  useEffect(() => {
    initAdMob();
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AuthRouter />
      </AuthProvider>
      <StatusBar style="dark" backgroundColor="#ffffff" />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
});