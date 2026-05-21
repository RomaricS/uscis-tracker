import { useState } from 'react'
import { Alert, ScrollView, StyleSheet, TextInput } from 'react-native'
import { YStack, XStack, Text, Button, Spinner } from 'tamagui'
import { useRouter } from 'expo-router'
import { supabase } from '../src/lib/supabase'
import { useSession } from '../src/hooks/useSession'
import { VisaType } from '../src/types'
import { color, space, radius, fontSize } from '../src/tokens'

function validateReceiptNumber(value: string): string | null {
  const trimmed = value.trim().toUpperCase()
  if (!trimmed) return 'Receipt number is required'
  if (trimmed.length < 10) return 'Receipt number must be at least 10 characters'
  if (!/^[A-Z0-9-]+$/.test(trimmed)) return 'Receipt number must contain only letters, digits, and hyphens'
  return null
}

export default function AddCaseScreen() {
  const router = useRouter()
  const { session } = useSession()

  const [receiptNo, setReceiptNo] = useState('')
  const [visaType, setVisaType] = useState<VisaType>('CR1')
  const [consulate, setConsulate] = useState('')
  const [countryBirth, setCountryBirth] = useState('')
  const [receiptError, setReceiptError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function handleReceiptChange(text: string) {
    setReceiptNo(text)
    if (receiptError) {
      setReceiptError(validateReceiptNumber(text))
    }
  }

  async function handleSave() {
    const error = validateReceiptNumber(receiptNo)
    if (error) {
      setReceiptError(error)
      return
    }
    setReceiptError(null)

    if (!session?.user?.id) {
      Alert.alert('Error', 'Not authenticated. Please sign in again.')
      return
    }

    setSubmitting(true)
    try {
      const { error: insertError } = await supabase.from('cases').insert({
        user_id: session.user.id,
        receipt_no: receiptNo.trim().toUpperCase(),
        visa_type: visaType,
        consulate: consulate.trim() || null,
        country_birth: countryBirth.trim() || null,
      })

      if (insertError) {
        Alert.alert('Error', insertError.message)
        return
      }

      router.replace('/')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred'
      Alert.alert('Error', message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <YStack gap={space[6]} paddingBottom={space[8]}>
        {/* Heading */}
        <Text
          fontFamily="$heading"
          fontSize={fontSize['2xl']}
          fontWeight="700"
          color={color.neutral900}
        >
          Add your case
        </Text>

        {/* Receipt Number */}
        <YStack gap={space[2]}>
          <Text
            fontFamily="$body"
            fontSize={fontSize.sm}
            fontWeight="600"
            color={color.neutral700}
          >
            Receipt Number *
          </Text>
          <TextInput
            style={[
              styles.input,
              receiptError ? styles.inputError : null,
            ]}
            value={receiptNo}
            onChangeText={handleReceiptChange}
            placeholder="e.g. IOE0000000000"
            placeholderTextColor={color.neutral200}
            keyboardType="default"
            autoCapitalize="characters"
            autoCorrect={false}
            editable={!submitting}
          />
          {receiptError ? (
            <Text
              fontFamily="$body"
              fontSize={fontSize.xs}
              color={color.error}
            >
              {receiptError}
            </Text>
          ) : null}
        </YStack>

        {/* Visa Type */}
        <YStack gap={space[2]}>
          <Text
            fontFamily="$body"
            fontSize={fontSize.sm}
            fontWeight="600"
            color={color.neutral700}
          >
            Visa Type *
          </Text>
          <XStack gap={space[3]}>
            {(['CR1', 'IR1'] as VisaType[]).map((type) => {
              const selected = visaType === type
              return (
                <Button
                  key={type}
                  flex={1}
                  height={44}
                  borderRadius={radius.md}
                  backgroundColor={selected ? color.bordeaux500 : color.neutral100}
                  borderWidth={selected ? 0 : 1}
                  borderColor={color.neutral200}
                  onPress={() => setVisaType(type)}
                  disabled={submitting}
                  pressStyle={{ opacity: 0.8 }}
                >
                  <Text
                    fontFamily="$body"
                    fontSize={fontSize.md}
                    fontWeight="600"
                    color={selected ? color.neutral0 : color.neutral700}
                  >
                    {type}
                  </Text>
                </Button>
              )
            })}
          </XStack>
        </YStack>

        {/* Consulate */}
        <YStack gap={space[2]}>
          <Text
            fontFamily="$body"
            fontSize={fontSize.sm}
            fontWeight="600"
            color={color.neutral700}
          >
            Consulate
          </Text>
          <TextInput
            style={styles.input}
            value={consulate}
            onChangeText={setConsulate}
            placeholder="e.g. Lagos, Nigeria"
            placeholderTextColor={color.neutral200}
            autoCapitalize="words"
            autoCorrect={false}
            editable={!submitting}
          />
        </YStack>

        {/* Country of Birth */}
        <YStack gap={space[2]}>
          <Text
            fontFamily="$body"
            fontSize={fontSize.sm}
            fontWeight="600"
            color={color.neutral700}
          >
            Country of Birth
          </Text>
          <TextInput
            style={styles.input}
            value={countryBirth}
            onChangeText={setCountryBirth}
            placeholder="e.g. Nigeria"
            placeholderTextColor={color.neutral200}
            autoCapitalize="words"
            autoCorrect={false}
            editable={!submitting}
          />
        </YStack>

        {/* Save Button */}
        <Button
          height={52}
          borderRadius={radius.md}
          backgroundColor={submitting ? color.bordeaux300 : color.bordeaux500}
          onPress={handleSave}
          disabled={submitting}
          pressStyle={{ opacity: 0.9 }}
          marginTop={space[4]}
        >
          {submitting ? (
            <XStack gap={space[3]} alignItems="center">
              <Spinner size="small" color={color.neutral0} />
              <Text
                fontFamily="$body"
                fontSize={fontSize.md}
                fontWeight="600"
                color={color.neutral0}
              >
                Saving…
              </Text>
            </XStack>
          ) : (
            <Text
              fontFamily="$body"
              fontSize={fontSize.md}
              fontWeight="600"
              color={color.neutral0}
            >
              Save
            </Text>
          )}
        </Button>
      </YStack>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: color.neutral50,
  },
  container: {
    padding: space[6],
    paddingTop: space[8],
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: color.neutral200,
    borderRadius: radius.md,
    paddingHorizontal: space[4],
    backgroundColor: color.neutral0,
    color: color.neutral900,
    fontSize: fontSize.md,
    fontFamily: 'PlusJakartaSans_400Regular',
  },
  inputError: {
    borderColor: color.error,
  },
})
