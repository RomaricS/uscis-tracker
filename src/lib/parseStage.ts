import { CR1Stage } from '../types'

/**
 * Maps a USCIS case status message to a CR1Stage.
 * Returns null if the status doesn't match any known pattern
 * (caller should preserve the current stage in that case).
 */
export function parseUSCISStatus(statusText: string): CR1Stage | null {
  const text = statusText.toLowerCase().trim()

  if (
    text.includes('case was received') ||
    text.includes('case is being actively reviewed') ||
    text.includes('case was updated')
  ) {
    return 'USCIS_RECEIVED'
  }

  if (
    text.includes('biometric') ||
    text.includes('fingerprint')
  ) {
    return 'BIOMETRICS'
  }

  if (
    text.includes('case was approved') ||
    text.includes('case has been approved') ||
    text.includes('case was transferred') ||
    text.includes('approval notice was sent') ||
    text.includes('card was produced') ||
    text.includes('card was mailed')
  ) {
    return 'I130_APPROVED'
  }

  return null
}

/**
 * Determines if biometrics was skipped based on a sequence of status messages.
 * USCIS sometimes skips biometrics for certain age groups or petition types.
 * If the case went from USCIS_RECEIVED directly to I130_APPROVED with no biometrics
 * message in between, biometrics was waived.
 */
export function wasBiometricsSkipped(statusHistory: string[]): boolean {
  const stages = statusHistory.map(parseUSCISStatus).filter(Boolean) as CR1Stage[]
  return !stages.includes('BIOMETRICS')
}
