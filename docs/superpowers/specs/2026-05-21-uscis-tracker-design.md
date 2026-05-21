# USCIS CR1 Tracker — Design Spec
**Date:** 2026-05-21
**Status:** Approved

---

## Overview

A React Native mobile app (iOS + Android) that lets users track their CR1 spousal green card application stage-by-stage, and see anonymized wait-time data contributed by others with similar cases. Published to the App Store and Google Play. Free to use, free to host.

---

## Decisions Made

| Question | Decision | Reason |
|---|---|---|
| Platform | React Native / Expo | iOS + Android, OTA updates, EAS Build for App Store |
| Data source | Client-side fetch via Supabase Edge Function | Server-side proxy more resilient than direct mobile fetch |
| Multi-user | Community opt-in, published to App Store | Anyone downloads; data sharing is opt-in |
| Auth | Sign in with Apple + Google (Supabase Auth) | Apple requires it for App Store social auth |
| Features v1 | Stage map + Community ETA | Focused scope, most valuable to CR1 applicants |
| UI library | Tamagui | First-class token system, dark/light mode, near-native perf |
| Design | Light bordeaux (`#A0384E`), Plus Jakarta Sans, dark/light | Agreed on during brainstorm |

---

## Architecture

### Stack (all free tier)

| Layer | Tool |
|---|---|
| Mobile app | Expo (React Native) |
| Auth | Supabase Auth — Apple Sign In + Google |
| Database | Supabase Postgres |
| USCIS proxy | Supabase Edge Function (Deno) |
| Local notifications | Expo Notifications |
| App Store delivery | Expo EAS Build (free tier) |

### Data Flow

```
User opens app
  → Auth check (Supabase JWT)
  → "Check my case" tap
      → Supabase Edge Function: POST receipt# to egov.uscis.gov
      → Parse HTML status response → return structured stage
  → If stage changed AND user opted_in = true
      → Write anonymized entry to community_timelines
  → Display: current position on CR1 stage map + community ETA
```

The edge function acts as a proxy, avoiding mobile IP blocks and enabling response caching. Cold start is ~200ms; Supabase free tier allows 500K invocations/month.

---

## Design System

### Token File (`tokens/index.ts`)

**Primitive tokens:**

```typescript
export const color = {
  bordeaux100: '#F9EEF0',
  bordeaux200: '#EDCDD3',
  bordeaux300: '#D9909D',
  bordeaux400: '#C4607A',   // light bordeaux
  bordeaux500: '#A0384E',   // main brand color
  bordeaux600: '#7B1D2E',
  bordeaux700: '#5C0F1E',

  neutral0:   '#FFFFFF',
  neutral50:  '#F5F2FA',
  neutral100: '#EAE6F0',
  neutral200: '#D0CDD8',
  neutral500: '#7A748A',
  neutral700: '#3A3448',
  neutral900: '#0E0C16',

  success: '#2D9E6B',
  warning: '#D4870A',
  error:   '#E53935',
}

export const space = {
  1: 4,  2: 8,  3: 12,
  4: 16, 5: 20, 6: 24,
  8: 32, 10: 40, 12: 48,
}

export const radius = {
  sm: 8, md: 12, lg: 16, xl: 24, full: 9999,
}

export const fontSize = {
  xs: 11, sm: 13, md: 15, lg: 17, xl: 20, '2xl': 26, '3xl': 32,
}
```

**Semantic tokens (`tokens/themes.ts`):**

```typescript
export const darkTheme = {
  bg:            color.neutral900,
  bgCard:        '#1A1626',
  bgSubtle:      '#14111C',
  textPrimary:   '#F0EEF5',
  textSecondary: color.neutral500,
  textMuted:     color.neutral700,
  primary:       color.bordeaux500,
  primaryLight:  color.bordeaux400,
  primaryDim:    'rgba(160,56,78,0.12)',
  border:        'rgba(255,255,255,0.07)',
  success:       color.success,
}

export const lightTheme = {
  bg:            color.neutral50,
  bgCard:        '#FDFBFF',
  bgSubtle:      color.neutral100,
  textPrimary:   '#1A1626',
  textSecondary: '#6A6478',
  textMuted:     color.neutral200,
  primary:       color.bordeaux500,
  primaryLight:  color.bordeaux400,
  primaryDim:    'rgba(160,56,78,0.08)',
  border:        'rgba(0,0,0,0.07)',
  success:       color.success,
}
```

These map directly to Tamagui's `createTokens()` and `createTheme()`.

---

## Screens (v1 — 5 screens)

| Screen | Purpose |
|---|---|
| Onboarding | Sign in with Apple / Google |
| Add Case | Receipt number + visa type + consulate + country of birth |
| Home (Stage Map) | Current CR1 stage highlighted, all 10 stages listed, last-checked timestamp |
| Community ETA | Median/P10/P90 wait times filtered by visa type + stage + consulate + year |
| Settings | Toggle data sharing, set check-in reminder cadence, delete account |

No bottom navigation bar needed for v1 — navigate via stack.

---

## CR1 Stage Map

10 stages spanning 3 agencies. USCIS stages (1–4) are auto-fetched. NVC and consulate stages (5–10) are user-logged.

```
1.  I130_FILED
2.  USCIS_RECEIVED
3.  BIOMETRICS          (skipped if waived; app treats it as optional — if USCIS status never mentions biometrics, stage is auto-skipped)
4.  I130_APPROVED       ← last USCIS-fetchable stage
─── NVC ────────────────────────────────────────
5.  NVC_RECEIVED
6.  NVC_PROCESSING
7.  DS260_SUBMITTED
─── Consulate ───────────────────────────────────
8.  INTERVIEW_SCHEDULED
9.  INTERVIEW_COMPLETED
10. VISA_ISSUED 🎉
```

---

## Database Schema

```sql
-- User's tracked cases (private via RLS)
create table cases (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users not null,
  receipt_no    text not null,
  visa_type     text not null,
  consulate     text,
  country_birth text,
  current_stage text,
  raw_status    text,
  last_checked       timestamptz,
  last_stage_change  timestamptz,   -- used to compute days_in_stage
  opted_in           boolean default false,
  created_at         timestamptz default now()
);

-- Anonymized community data (no user_id by design)
create table community_timelines (
  id            uuid primary key default gen_random_uuid(),
  visa_type     text not null,
  consulate     text,
  country_birth text,
  stage         text not null,
  days_in_stage int,
  year          int,
  created_at    timestamptz default now()
);
```

Row-level security on `cases`: users can only read/write their own rows.
`community_timelines` has no `user_id` — no join path back to any individual.

---

## Community ETA Logic

**Writing a data point** (edge function, on stage change + opted_in):

```typescript
if (case.opted_in && previousStage !== newStage) {
  const daysInStage = differenceInDays(new Date(), case.last_stage_change)
  await supabase.from('community_timelines').insert({
    visa_type:     case.visa_type,
    consulate:     case.consulate,
    country_birth: case.country_birth,
    stage:         previousStage,
    days_in_stage: daysInStage,
    year:          new Date(case.created_at).getFullYear(),
  })
}
```

**Reading ETA** (Postgres query):

```sql
select
  percentile_cont(0.5) within group (order by days_in_stage) as median_days,
  percentile_cont(0.1) within group (order by days_in_stage) as p10_days,
  percentile_cont(0.9) within group (order by days_in_stage) as p90_days,
  count(*) as sample_size
from community_timelines
where visa_type = $1
  and stage     = $2
  and consulate = $3        -- optional
  and year     >= $4        -- last 2 years
```

**Fallback when sample < 20:**

1. `visa_type + stage + consulate + year` → widen if < 20
2. `visa_type + stage + year` → widen if < 20
3. `visa_type + stage` → always show, label as global median
4. Always display `sample_size` so users can judge reliability

---

## Local Notifications

Since data fetching is client-initiated (no background push), the app schedules a weekly local notification prompting the user to open the app and check their case. Cadence is configurable in Settings (weekly / biweekly / monthly).

---

## Out of Scope (v1)

- Multiple case tracking per account
- Document checklists
- Visa bulletin / priority date tracking
- Push notifications (server-initiated)
- Web dashboard
- Visa types beyond CR1/IR1 (can extend stage map later)

---

## Free Tier Limits (sanity check)

| Service | Free limit | Expected v1 usage |
|---|---|---|
| Supabase DB | 500 MB | Well under for early users |
| Supabase Edge Functions | 500K invocations/mo | ~1 per user per app open |
| Supabase Auth | Unlimited MAUs | ✅ |
| Expo EAS Build | 30 builds/mo | ✅ |
| App Store | $99/yr (already owned) | ✅ |
| Google Play | $25 one-time | ✅ |
