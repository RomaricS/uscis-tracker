import { useEffect } from 'react'
import { View } from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '../../src/lib/supabase'

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace('/')
      } else {
        router.replace('/onboarding')
      }
    })
  }, [])

  return <View style={{ flex: 1 }} />
}
