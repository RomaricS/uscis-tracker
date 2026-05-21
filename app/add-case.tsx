import { View } from 'react-native'
import { Text } from 'tamagui'
import { color } from '../src/tokens'

export default function AddCaseScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: color.neutral50, alignItems: 'center', justifyContent: 'center' }}>
      <Text fontSize="$lg" color={color.neutral700}>Add Case coming soon</Text>
    </View>
  )
}
