import { View, Platform, Alert } from 'react-native'
import { YStack, Text, Button } from 'tamagui'
import * as AppleAuthentication from 'expo-apple-authentication'
import * as Crypto from 'expo-crypto'
import * as WebBrowser from 'expo-web-browser'
import { supabase } from '../src/lib/supabase'
import { useRouter } from 'expo-router'
import { useSession } from '../src/hooks/useSession'
import { useEffect } from 'react'
import { color } from '../src/tokens'

export default function OnboardingScreen() {
  const router = useRouter()
  const { session, loading } = useSession()

  useEffect(() => {
    if (!loading && session) {
      router.replace('/')
    }
  }, [session, loading, router])

  async function signInWithApple() {
    try {
      const rawNonce = Crypto.randomUUID()
      const hashedNonce = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        rawNonce
      )
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashedNonce,
      })
      if (!credential.identityToken) throw new Error('Apple did not return an identity token.')
      const { error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken,
        nonce: rawNonce,
      })
      if (error) throw error
    } catch (err: any) {
      if (err.code !== 'ERR_REQUEST_CANCELED') {
        Alert.alert('Sign in failed', err.message)
      }
    }
  }

  async function signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'uscis-tracker://auth/callback',
        skipBrowserRedirect: true,
      },
    })
    if (error) { Alert.alert('Sign in failed', error.message); return }
    if (data.url) {
      await WebBrowser.openAuthSessionAsync(data.url, 'uscis-tracker://auth/callback')
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: color.neutral900 }}>
      <YStack flex={1} padding="$6" justifyContent="space-between">
        {/* Header */}
        <YStack gap="$3" marginTop="$12">
          <Text
            fontSize="$3xl"
            fontWeight="700"
            color={color.neutral0}
            fontFamily="$heading"
          >
            {`Track your\nCR1 visa journey`}
          </Text>
          <Text
            fontSize="$md"
            color={color.neutral500}
            lineHeight={22}
          >
            Know exactly where your application stands — and how long others waited.
          </Text>
        </YStack>

        {/* Sign-in buttons */}
        <YStack gap="$3" paddingBottom="$8">
          {Platform.OS === 'ios' && AppleAuthentication.AppleAuthenticationButton && (
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
              cornerRadius={12}
              style={{ width: '100%', height: 50 }}
              onPress={signInWithApple}
            />
          )}
          <Button
            size="$5"
            backgroundColor={color.bordeaux500}
            borderRadius="$md"
            onPress={signInWithGoogle}
          >
            <Button.Text fontWeight="600" color={color.neutral0}>
              Continue with Google
            </Button.Text>
          </Button>
          <Text
            fontSize="$xs"
            color={color.neutral500}
            textAlign="center"
            paddingTop="$2"
          >
            Your data is private. Community data sharing is opt-in.
          </Text>
        </YStack>
      </YStack>
    </View>
  )
}
