import { parseUSCISStatus, wasBiometricsSkipped } from '../parseStage'

describe('parseUSCISStatus', () => {
  it('maps "Case Was Received" to USCIS_RECEIVED', () => {
    expect(parseUSCISStatus('Case Was Received')).toBe('USCIS_RECEIVED')
  })

  it('maps "Case Is Being Actively Reviewed" to USCIS_RECEIVED', () => {
    expect(parseUSCISStatus('Case Is Being Actively Reviewed')).toBe('USCIS_RECEIVED')
  })

  it('maps biometric scheduling to BIOMETRICS', () => {
    expect(parseUSCISStatus('Your biometric appointment has been scheduled')).toBe('BIOMETRICS')
  })

  it('maps fingerprint to BIOMETRICS', () => {
    expect(parseUSCISStatus('Fingerprint appointment scheduled')).toBe('BIOMETRICS')
  })

  it('maps "Case Was Approved" to I130_APPROVED', () => {
    expect(parseUSCISStatus('Case Was Approved')).toBe('I130_APPROVED')
  })

  it('maps "Case Was Transferred" to I130_APPROVED', () => {
    expect(parseUSCISStatus('Case Was Transferred And A New Office Has Jurisdiction')).toBe('I130_APPROVED')
  })

  it('maps "Approval Notice Was Sent" to I130_APPROVED', () => {
    expect(parseUSCISStatus('Approval Notice Was Sent')).toBe('I130_APPROVED')
  })

  it('does not mis-classify generic "Notice Was Sent" as I130_APPROVED', () => {
    expect(parseUSCISStatus('Notice Was Sent')).toBeNull()
  })

  it('maps "Card Was Produced" to I130_APPROVED', () => {
    expect(parseUSCISStatus('Card Was Produced')).toBe('I130_APPROVED')
  })

  it('maps "Case Was Updated" to USCIS_RECEIVED', () => {
    expect(parseUSCISStatus('Case Was Updated')).toBe('USCIS_RECEIVED')
  })

  it('returns null for unrecognized status', () => {
    expect(parseUSCISStatus('Request For Additional Evidence Was Sent')).toBeNull()
  })

  it('returns null for empty string', () => {
    expect(parseUSCISStatus('')).toBeNull()
  })

  it('is case-insensitive', () => {
    expect(parseUSCISStatus('CASE WAS RECEIVED')).toBe('USCIS_RECEIVED')
    expect(parseUSCISStatus('case was received')).toBe('USCIS_RECEIVED')
  })
})

describe('wasBiometricsSkipped', () => {
  it('returns false when biometrics is in history', () => {
    expect(wasBiometricsSkipped([
      'Case Was Received',
      'Biometrics appointment scheduled',
      'Case Was Approved',
    ])).toBe(false)
  })

  it('returns true when no biometrics in history', () => {
    expect(wasBiometricsSkipped([
      'Case Was Received',
      'Case Was Approved',
    ])).toBe(true)
  })

  it('returns true for empty history', () => {
    expect(wasBiometricsSkipped([])).toBe(true)
  })
})
