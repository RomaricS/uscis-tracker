import { createTamagui, createTokens, createFont } from '@tamagui/core'
import { color, space, radius, fontSize } from './src/tokens/index'
import { darkTheme, lightTheme } from './src/tokens/themes'

const jakartaFont = createFont({
  family: 'PlusJakartaSans_400Regular, System',
  size: {
    xs: fontSize.xs,
    sm: fontSize.sm,
    md: fontSize.md,
    lg: fontSize.lg,
    xl: fontSize.xl,
    '2xl': fontSize['2xl'],
    '3xl': fontSize['3xl'],
  },
  lineHeight: {
    xs: 16, sm: 18, md: 22, lg: 24, xl: 28, '2xl': 34, '3xl': 40,
  },
  weight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  letterSpacing: {
    md: 0,
  },
})

const tokens = createTokens({
  color,
  space,
  radius,
  size: space,
  zIndex: { base: 0, overlay: 100, modal: 200 },
})

export const config = createTamagui({
  tokens,
  themes: {
    dark: darkTheme,
    light: lightTheme,
  },
  fonts: {
    heading: jakartaFont,
    body: jakartaFont,
  },
  settings: {
    defaultFont: 'body',
    shouldAddPrefersColorThemes: true,
    themeClassNameOnRoot: false,
  },
})

export default config

export type Conf = typeof config

declare module '@tamagui/core' {
  interface TamaguiCustomConfig extends Conf {}
}
