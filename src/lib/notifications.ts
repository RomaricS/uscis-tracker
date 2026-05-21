import * as Notifications from 'expo-notifications'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { NotificationCadence } from '../types'

const NOTIFICATION_ID_KEY = 'scheduled_notification_id'
const NOTIFICATION_CHANNEL_ID = 'case-reminders'

// Configure how notifications appear when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
})

export async function requestNotificationPermission(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync()
  if (existing === 'granted') return true

  const { status } = await Notifications.requestPermissionsAsync()
  return status === 'granted'
}

export async function scheduleCheckReminder(cadence: NotificationCadence): Promise<void> {
  const hasPermission = await requestNotificationPermission()
  if (!hasPermission) return

  // Cancel any existing reminder first
  await cancelCheckReminder()

  const seconds = cadenceToSeconds(cadence)

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Check your case status',
      body: 'Tap to see if your CR1 application has moved to a new stage.',
      data: { type: 'case_check_reminder' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds,
      repeats: true,
    },
  })

  await AsyncStorage.setItem(NOTIFICATION_ID_KEY, id)
}

export async function cancelCheckReminder(): Promise<void> {
  const id = await AsyncStorage.getItem(NOTIFICATION_ID_KEY)
  if (id) {
    await Notifications.cancelScheduledNotificationAsync(id)
    await AsyncStorage.removeItem(NOTIFICATION_ID_KEY)
  }
}

function cadenceToSeconds(cadence: NotificationCadence): number {
  switch (cadence) {
    case 'weekly':    return 7 * 24 * 60 * 60
    case 'biweekly':  return 14 * 24 * 60 * 60
    case 'monthly':   return 30 * 24 * 60 * 60
  }
}

export async function getScheduledReminder(): Promise<string | null> {
  return AsyncStorage.getItem(NOTIFICATION_ID_KEY)
}

export { NOTIFICATION_CHANNEL_ID }
