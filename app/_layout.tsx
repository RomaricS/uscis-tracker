import { Stack, SplashScreen } from 'expo-router'
import { TamaguiProvider } from '@tamagui/core'
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans'
import { useEffect } from 'react'
import { Platform, View } from 'react-native'
import * as Notifications from 'expo-notifications'
import config from '../tamagui.config'
import { useSession } from '../src/hooks/useSession'
import OnboardingScreen from './onboarding'
import { color } from '../src/tokens'

const NOTIFICATION_CHANNEL_ID = 'case-reminders'

SplashScreen.preventAutoHideAsync()

// Set up Android notification channel
if (Platform.OS === 'android') {
  Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNEL_ID, {
    name: 'Case Reminders',
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 250, 250, 250],
  })
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  })
  const { session, loading } = useSession()

  useEffect(() => {
    if (fontsLoaded && !loading) SplashScreen.hideAsync()
  }, [fontsLoaded, loading])

  if (!fontsLoaded || loading) {
    return <View style={{ flex: 1, backgroundColor: color.bordeaux500 }} />
  }

  return (
    <TamaguiProvider config={config} defaultTheme="light">
      {session ? (
        <Stack screenOptions={{ headerShown: false }} />
      ) : (
        <OnboardingScreen />
      )}
    </TamaguiProvider>
  )
}
