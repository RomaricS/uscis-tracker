import { useState, useEffect } from 'react'
import { ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, SafeAreaView } from 'react-native'
import { YStack, XStack, Text } from 'tamagui'
import { useRouter } from 'expo-router'
import { CR1_STAGES, STAGE_LABELS, STAGE_AGENCY, USCIS_FETCHABLE_STAGES } from '../src/types'
import type { Case, CR1Stage } from '../src/types'
import { supabase } from '../src/lib/supabase'
import { useSession } from '../src/hooks/useSession'
import { color, space, radius, fontSize } from '../src/tokens'

type StageStatus = 'completed' | 'current' | 'upcoming'

function getStageStatus(stage: CR1Stage, currentStage: CR1Stage | null): StageStatus {
  if (!currentStage) return 'upcoming'
  if (stage === currentStage) return 'current'
  const stageIdx = CR1_STAGES.indexOf(stage)
  const currentIdx = CR1_STAGES.indexOf(currentStage)
  return stageIdx < currentIdx ? 'completed' : 'upcoming'
}

function formatLastChecked(isoString: string | null): string {
  if (!isoString) return ''
  const date = new Date(isoString)
  return `Last checked: ${date.toLocaleDateString()} at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
}

export default function HomeScreen() {
  const router = useRouter()
  const { session } = useSession()
  const [currentCase, setCurrentCase] = useState<Case | null>(null)
  const [checking, setChecking] = useState(false)
  const [checkError, setCheckError] = useState<string | null>(null)

  useEffect(() => {
    if (!session) return
    supabase
      .from('cases')
      .select('*')
      .eq('user_id', session.user.id)
      .single()
      .then(({ data }) => { if (data) setCurrentCase(data as Case) })
  }, [session])

  async function checkCase() {
    if (!session) return
    setChecking(true)
    setCheckError(null)
    try {
      // Will be replaced with real Supabase Edge Function call in Task 13
      const { data: cases, error: fetchError } = await supabase
        .from('cases')
        .select('*')
        .eq('user_id', session.user.id)
        .single()

      if (fetchError) throw fetchError
      if (cases) setCurrentCase(cases as Case)
    } catch {
      setCheckError('Could not check your case. Please try again.')
    } finally {
      setChecking(false)
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <XStack
        justifyContent="space-between"
        alignItems="center"
        paddingHorizontal={space[6]}
        paddingVertical={space[4]}
        backgroundColor={color.neutral0}
        borderBottomWidth={1}
        borderBottomColor={color.neutral100}
      >
        <Text
          fontFamily="$heading"
          fontSize={fontSize.xl}
          fontWeight="700"
          color={color.neutral900}
        >
          My CR1 Case
        </Text>
        <TouchableOpacity onPress={() => router.push('/settings')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text fontSize={fontSize.xl}>⚙️</Text>
        </TouchableOpacity>
      </XStack>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {currentCase === null ? (
          /* No case yet */
          <YStack flex={1} alignItems="center" justifyContent="center" gap={space[4]} paddingTop={80}>
            <Text
              fontFamily="$body"
              fontSize={fontSize.lg}
              color={color.neutral500}
              textAlign="center"
            >
              Add your case to get started
            </Text>
            <TouchableOpacity style={styles.addCaseButton} onPress={() => router.push('/add-case')}>
              <Text
                fontFamily="$body"
                fontSize={fontSize.md}
                fontWeight="600"
                color={color.neutral0}
              >
                Add Case
              </Text>
            </TouchableOpacity>
          </YStack>
        ) : (
          <YStack gap={space[4]} paddingBottom={space[8]}>
            {/* Stage Map */}
            <YStack
              backgroundColor={color.neutral0}
              borderRadius={radius.lg}
              overflow="hidden"
              borderWidth={1}
              borderColor={color.neutral100}
            >
              {CR1_STAGES.map((stage, index) => {
                const status = getStageStatus(stage, currentCase.current_stage)
                const agency = STAGE_AGENCY[stage]
                const isFetchable = USCIS_FETCHABLE_STAGES.has(stage)
                const prevStage = index > 0 ? CR1_STAGES[index - 1] : null
                const showAgencyBadge = prevStage === null || STAGE_AGENCY[prevStage] !== agency

                return (
                  <YStack key={stage}>
                    {/* Agency separator */}
                    {showAgencyBadge && (
                      <XStack
                        paddingHorizontal={space[4]}
                        paddingVertical={space[2]}
                        backgroundColor={color.neutral50}
                        alignItems="center"
                        gap={space[2]}
                        borderTopWidth={index === 0 ? 0 : 1}
                        borderTopColor={color.neutral100}
                      >
                        <Text
                          fontFamily="$body"
                          fontSize={fontSize.xs}
                          fontWeight="600"
                          color={color.neutral500}
                          letterSpacing={0.8}
                        >
                          {agency.toUpperCase()}
                        </Text>
                      </XStack>
                    )}

                    {/* Stage row */}
                    <XStack
                      paddingHorizontal={space[4]}
                      paddingVertical={space[3]}
                      alignItems="center"
                      gap={space[3]}
                      backgroundColor={status === 'current' ? color.bordeaux500 : color.neutral0}
                      borderTopWidth={showAgencyBadge ? 0 : 1}
                      borderTopColor={color.neutral100}
                    >
                      {/* Status indicator */}
                      <YStack
                        width={28}
                        height={28}
                        borderRadius={radius.full}
                        alignItems="center"
                        justifyContent="center"
                        backgroundColor={
                          status === 'completed'
                            ? color.success
                            : status === 'current'
                            ? color.bordeaux700
                            : color.neutral100
                        }
                      >
                        {status === 'completed' ? (
                          <Text fontSize={fontSize.sm} color={color.neutral0} fontWeight="700">✓</Text>
                        ) : (
                          <Text
                            fontSize={fontSize.xs}
                            color={status === 'current' ? color.neutral0 : color.neutral500}
                            fontWeight="600"
                          >
                            {index + 1}
                          </Text>
                        )}
                      </YStack>

                      {/* Stage label */}
                      <YStack flex={1}>
                        <Text
                          fontFamily="$body"
                          fontSize={fontSize.md}
                          fontWeight={status === 'current' ? '700' : '500'}
                          color={
                            status === 'current'
                              ? color.neutral0
                              : status === 'completed'
                              ? color.neutral700
                              : color.neutral500
                          }
                        >
                          {STAGE_LABELS[stage]}
                        </Text>
                        {/* Auto-fetch / tap-to-log indicator */}
                        <Text
                          fontFamily="$body"
                          fontSize={fontSize.xs}
                          color={
                            status === 'current'
                              ? color.bordeaux200
                              : color.neutral500
                          }
                        >
                          {isFetchable ? 'Auto-fetched from USCIS' : 'Tap to log'}
                        </Text>
                      </YStack>
                    </XStack>
                  </YStack>
                )
              })}
            </YStack>

            {/* Last checked timestamp */}
            {currentCase.last_checked ? (
              <Text
                fontFamily="$body"
                fontSize={fontSize.xs}
                color={color.neutral500}
                textAlign="center"
              >
                {formatLastChecked(currentCase.last_checked)}
              </Text>
            ) : null}

            {/* Check my case button */}
            <TouchableOpacity
              style={[styles.checkButton, checking && styles.checkButtonDisabled]}
              onPress={checkCase}
              disabled={checking}
              activeOpacity={0.85}
            >
              {checking ? (
                <XStack gap={space[3]} alignItems="center" justifyContent="center">
                  <ActivityIndicator size="small" color={color.neutral0} />
                  <Text
                    fontFamily="$body"
                    fontSize={fontSize.md}
                    fontWeight="600"
                    color={color.neutral0}
                  >
                    Checking…
                  </Text>
                </XStack>
              ) : (
                <Text
                  fontFamily="$body"
                  fontSize={fontSize.md}
                  fontWeight="600"
                  color={color.neutral0}
                  textAlign="center"
                >
                  Check my case
                </Text>
              )}
            </TouchableOpacity>

            {checkError && (
              <Text fontSize={fontSize.sm} color={color.error} textAlign="center">
                {checkError}
              </Text>
            )}

            {/* Community ETA link */}
            <TouchableOpacity
              onPress={() => router.push('/community-eta')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text
                fontFamily="$body"
                fontSize={fontSize.sm}
                fontWeight="600"
                color={color.bordeaux500}
                textAlign="center"
              >
                Check Community ETA
              </Text>
            </TouchableOpacity>
          </YStack>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: color.neutral50,
  },
  scroll: {
    flex: 1,
    backgroundColor: color.neutral50,
  },
  scrollContent: {
    padding: space[4],
    paddingTop: space[4],
    flexGrow: 1,
  },
  addCaseButton: {
    backgroundColor: color.bordeaux500,
    paddingVertical: space[3],
    paddingHorizontal: space[8],
    borderRadius: radius.md,
  },
  checkButton: {
    backgroundColor: color.bordeaux500,
    height: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkButtonDisabled: {
    backgroundColor: color.bordeaux300,
  },
})
