import { Pressable, Text, View } from 'react-native';
import { colors } from '../lib/theme';

/** Selector de estrellas 1..5 (toque). 0 = sin calificar. */
export function StarInput({
  value,
  onChange,
  size = 28,
}: {
  value: number;
  onChange: (v: number) => void;
  size?: number;
}) {
  return (
    <View style={{ flexDirection: 'row' }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Pressable key={i} onPress={() => onChange(i)} hitSlop={4} accessibilityLabel={`${i} de 5`}>
          <Text
            style={{
              fontSize: size,
              paddingHorizontal: 2,
              color: i <= value ? colors.barro : colors.niebla,
            }}
          >
            ★
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
