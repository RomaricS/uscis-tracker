import { ScrollView, ActivityIndicator } from 'react-native'
import { YStack, XStack, Text } from 'tamagui'
import { useEffect, useState } from 'react'
import { useSession } from '../src/hooks/useSession'
import { supabase } from '../src/lib/supabase'
import { fetchStageETA } from '../src/lib/communityETA'
import { CR1_STAGES, STAGE_LABELS, StageETA } from '../src/types'
import { color } from '../src/tokens'
import type { Case } from '../src/types'

export default function CommunityETAScreen() {
  const { session } = useSession()
  const [currentCase, setCurrentCase] = useState<Case | null>(null)
  const [etas, setEtas] = useState<Record<string, StageETA>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session) return
    supabase
      .from('cases')
      .select('*')
      .eq('user_id', session.user.id)
      .single()
      .then(({ data }) => {
        if (data) setCurrentCase(data)
      })
  }, [session])

  useEffect(() => {
    if (!currentCase) { setLoading(false); return }

    const currentYear = new Date().getFullYear()
    const stagesToFetch = CR1_STAGES.slice(0, 4) // USCIS stages only for ETA

    Promise.all(
      stagesToFetch.map(stage =>
        fetchStageETA({
          visaType: currentCase.visa_type,
          stage,
          consulate: currentCase.consulate,
          year: currentYear,
        }).then(eta => ({ stage, eta }))
      )
    ).then(results => {
      const etaMap: Record<string, StageETA> = {}
      results.forEach(({ stage, eta }) => { etaMap[stage] = eta })
      setEtas(etaMap)
      setLoading(false)
    })
  }, [currentCase])

  if (loading) {
    return (
      <YStack flex={1} alignItems="center" justifyContent="center" backgroundColor={color.neutral50}>
        <ActivityIndicator color={color.bordeaux500} />
      </YStack>
    )
  }

  if (!currentCase) {
    return (
      <YStack flex={1} alignItems="center" justifyContent="center" padding="$6" backgroundColor={color.neutral50}>
        <Text color={color.neutral700} textAlign="center">
          Add your case first to see community wait times.
        </Text>
      </YStack>
    )
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: color.neutral50 }}>
      <YStack padding="$4" gap="$4">
        <Text fontSize="$xl" fontWeight="700" color={color.neutral900}>
          Community Wait Times
        </Text>
        <Text fontSize="$sm" color={color.neutral500}>
          Based on anonymized data from others with {currentCase.visa_type} cases
          {currentCase.consulate ? ` at ${currentCase.consulate}` : ''}.
        </Text>

        {CR1_STAGES.slice(0, 4).map(stage => {
          const eta = etas[stage]
          return (
            <YStack
              key={stage}
              padding="$4"
              backgroundColor={color.neutral0}
              borderRadius="$md"
              gap="$2"
            >
              <Text fontWeight="600" color={color.neutral900}>{STAGE_LABELS[stage]}</Text>
              {eta && eta.sample_size > 0 ? (
                <>
                  <XStack gap="$4">
                    <YStack>
                      <Text fontSize="$xs" color={color.neutral500}>Median</Text>
                      <Text fontSize="$lg" fontWeight="700" color={color.bordeaux500}>
                        {eta.median_days}d
                      </Text>
                    </YStack>
                    <YStack>
                      <Text fontSize="$xs" color={color.neutral500}>Fastest 10%</Text>
                      <Text fontSize="$lg" fontWeight="700" color={color.success}>
                        {eta.p10_days}d
                      </Text>
                    </YStack>
                    <YStack>
                      <Text fontSize="$xs" color={color.neutral500}>Slowest 10%</Text>
                      <Text fontSize="$lg" fontWeight="700" color={color.warning}>
                        {eta.p90_days}d
                      </Text>
                    </YStack>
                  </XStack>
                  <Text fontSize="$xs" color={color.neutral500}>
                    {eta.sample_size} {eta.sample_size === 1 ? 'report' : 'reports'}
                    {eta.is_global_fallback ? ' (global data — limited local data)' : ''}
                  </Text>
                </>
              ) : (
                <Text fontSize="$sm" color={color.neutral500}>No community data yet for this stage.</Text>
              )}
            </YStack>
          )
        })}
      </YStack>
    </ScrollView>
  )
}
