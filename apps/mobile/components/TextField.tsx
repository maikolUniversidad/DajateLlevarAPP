import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, type TextInputProps, View } from 'react-native';
import { colors, radius, typography } from '../lib/theme';

/**
 * Campo de texto tipo píldora con icono opcional a la derecha.
 * Para contraseñas, `secure` añade el conmutador mostrar/ocultar.
 */
export function TextField({
  icon,
  secure = false,
  style,
  ...props
}: TextInputProps & { icon?: string; secure?: boolean }) {
  const [hidden, setHidden] = useState(secure);

  return (
    <View style={styles.wrap}>
      <TextInput
        placeholderTextColor={colors.humo}
        secureTextEntry={hidden}
        style={[styles.input, style]}
        {...props}
      />
      {secure ? (
        <Pressable
          hitSlop={8}
          onPress={() => setHidden((h) => !h)}
          accessibilityRole="button"
          accessibilityLabel={hidden ? 'Mostrar contraseña' : 'Ocultar contraseña'}
        >
          <Text style={styles.icon}>{hidden ? '🔒' : '🔓'}</Text>
        </Pressable>
      ) : icon ? (
        <Text style={styles.icon}>{icon}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
    paddingHorizontal: 20,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: typography.body,
    color: colors.carbon,
    paddingVertical: 0,
  },
  icon: { fontSize: 16, color: colors.violeta },
});
