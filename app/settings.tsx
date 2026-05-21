import { View } from 'react-native'
import { Text } from 'tamagui'
import { color } from '../src/tokens'

export default function SettingsScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: color.neutral50, alignItems: 'center', justifyContent: 'center' }}>
      <Text fontSize="$lg" color={color.neutral700}>Settings coming soon</Text>
    </View>
  )
}
