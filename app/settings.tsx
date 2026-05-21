import { useEffect, useState } from 'react'
import { Alert, Switch } from 'react-native'
import { YStack, XStack, Text } from 'tamagui'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { supabase } from '../src/lib/supabase'
import { useSession } from '../src/hooks/useSession'
import { NotificationCadence } from '../src/types'
import { color } from '../src/tokens'

const CADENCE_OPTIONS: { label: string; value: NotificationCadence }[] = [
  { label: 'Weekly', value: 'weekly' },
  { label: 'Biweekly', value: 'biweekly' },
  { label: 'Monthly', value: 'monthly' },
]

export default function SettingsScreen() {
  const { session } = useSession()
  const [optedIn, setOptedIn] = useState(false)
  const [cadence, setCadence] = useState<NotificationCadence>('weekly')
  const [loadingCase, setLoadingCase] = useState(true)

  useEffect(() => {
    if (!session) return
    // Load opted_in from cases table
    supabase
      .from('cases')
      .select('opted_in')
      .eq('user_id', session.user.id)
      .single()
      .then(({ data }) => {
        if (data) setOptedIn(data.opted_in)
        setLoadingCase(false)
      })
    // Load cadence from AsyncStorage
    AsyncStorage.getItem('notification_cadence').then(val => {
      if (val === 'weekly' || val === 'biweekly' || val === 'monthly') setCadence(val)
    })
  }, [session])

  async function handleToggleOptIn(value: boolean) {
    if (!session) return
    setOptedIn(value)
    await supabase
      .from('cases')
      .update({ opted_in: value })
      .eq('user_id', session.user.id)
  }

  async function handleCadenceChange(value: NotificationCadence) {
    setCadence(value)
    await AsyncStorage.setItem('notification_cadence', value)
  }

  async function handleDeleteAccount() {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all your data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (!session) return
              await supabase.rpc('delete_user_data', { target_user_id: session.user.id })
              await supabase.auth.signOut()
            } catch (err: any) {
              Alert.alert('Error', err.message)
            }
          },
        },
      ]
    )
  }

  return (
    <YStack flex={1} backgroundColor={color.neutral50} padding={16} gap={24}>
      {/* Section 1: Data Sharing */}
      <YStack gap={8}>
        <Text
          fontSize={11}
          fontWeight="600"
          color={color.neutral500}
          textTransform="uppercase"
          letterSpacing={0.5}
        >
          Privacy
        </Text>
        <YStack
          backgroundColor={color.neutral0}
          borderRadius={12}
          padding={16}
          gap={8}
        >
          <XStack justifyContent="space-between" alignItems="center">
            <YStack flex={1} paddingRight={12}>
              <Text fontSize={15} fontWeight="600" color={color.neutral900}>
                Contribute to Community Data
              </Text>
              <Text fontSize={13} color={color.neutral500} marginTop={4}>
                Your stage transitions are shared anonymously when enabled.
              </Text>
            </YStack>
            <Switch
              value={optedIn}
              onValueChange={handleToggleOptIn}
              disabled={loadingCase}
              trackColor={{ false: color.neutral200, true: color.bordeaux400 }}
              thumbColor={color.neutral0}
            />
          </XStack>
        </YStack>
      </YStack>

      {/* Section 2: Reminder Cadence */}
      <YStack gap={8}>
        <Text
          fontSize={11}
          fontWeight="600"
          color={color.neutral500}
          textTransform="uppercase"
          letterSpacing={0.5}
        >
          Notifications
        </Text>
        <YStack
          backgroundColor={color.neutral0}
          borderRadius={12}
          padding={16}
          gap={12}
        >
          <Text fontSize={15} fontWeight="600" color={color.neutral900}>
            Reminder Frequency
          </Text>
          <XStack gap={8}>
            {CADENCE_OPTIONS.map(option => {
              const selected = cadence === option.value
              return (
                <YStack
                  key={option.value}
                  flex={1}
                  paddingVertical={8}
                  paddingHorizontal={4}
                  borderRadius={8}
                  borderWidth={1.5}
                  borderColor={selected ? color.bordeaux400 : color.neutral200}
                  backgroundColor={selected ? color.bordeaux100 : color.neutral0}
                  alignItems="center"
                  justifyContent="center"
                  onPress={() => handleCadenceChange(option.value)}
                  pressStyle={{ opacity: 0.75 }}
                >
                  <Text
                    fontSize={13}
                    fontWeight={selected ? '600' : '400'}
                    color={selected ? color.bordeaux600 : color.neutral700}
                  >
                    {option.label}
                  </Text>
                </YStack>
              )
            })}
          </XStack>
        </YStack>
      </YStack>

      {/* Section 3: Delete Account */}
      <YStack gap={8}>
        <Text
          fontSize={11}
          fontWeight="600"
          color={color.neutral500}
          textTransform="uppercase"
          letterSpacing={0.5}
        >
          Danger Zone
        </Text>
        <YStack
          backgroundColor={color.neutral0}
          borderRadius={12}
          padding={16}
        >
          <Text
            fontSize={15}
            fontWeight="600"
            color={color.error}
            onPress={handleDeleteAccount}
            pressStyle={{ opacity: 0.7 }}
          >
            Delete Account
          </Text>
        </YStack>
      </YStack>
    </YStack>
  )
}
