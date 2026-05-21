import { supabase } from './supabase'
import { CR1Stage, StageETA } from '../types'

export async function fetchStageETA(params: {
  visaType: string
  stage: CR1Stage
  consulate: string | null
  year: number
}): Promise<StageETA> {
  const currentYear = params.year
  const twoYearsAgo = currentYear - 2

  // Try 1: visa_type + stage + consulate + year (most specific)
  if (params.consulate) {
    const result = await queryETA({
      visaType: params.visaType,
      stage: params.stage,
      consulate: params.consulate,
      minYear: twoYearsAgo,
    })
    if (result && result.sample_size >= 20) {
      return { ...result, is_global_fallback: false }
    }
  }

  // Try 2: visa_type + stage + year (no consulate)
  const result2 = await queryETA({
    visaType: params.visaType,
    stage: params.stage,
    consulate: null,
    minYear: twoYearsAgo,
  })
  if (result2 && result2.sample_size >= 20) {
    return { ...result2, is_global_fallback: false }
  }

  // Try 3: visa_type + stage only (global fallback, all time)
  const result3 = await queryETA({
    visaType: params.visaType,
    stage: params.stage,
    consulate: null,
    minYear: 0,
  })
  return {
    stage: params.stage,
    median_days: result3?.median_days ?? 0,
    p10_days: result3?.p10_days ?? 0,
    p90_days: result3?.p90_days ?? 0,
    sample_size: result3?.sample_size ?? 0,
    is_global_fallback: true,
  }
}

async function queryETA(params: {
  visaType: string
  stage: CR1Stage
  consulate: string | null
  minYear: number
}): Promise<Omit<StageETA, 'is_global_fallback'> | null> {
  let query = supabase
    .from('community_timelines')
    .select('days_in_stage')
    .eq('visa_type', params.visaType)
    .eq('stage', params.stage)
    .gte('year', params.minYear)

  if (params.consulate) {
    query = query.eq('consulate', params.consulate)
  }

  const { data, error } = await query

  if (error || !data || data.length === 0) return null

  const values = data.map(r => r.days_in_stage).sort((a, b) => a - b)
  const n = values.length

  return {
    stage: params.stage,
    median_days: percentile(values, 0.5),
    p10_days: percentile(values, 0.1),
    p90_days: percentile(values, 0.9),
    sample_size: n,
  }
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0
  const idx = Math.max(0, Math.ceil(p * sorted.length) - 1)
  return sorted[idx]
}
