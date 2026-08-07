import { formatMoney } from '@dejatellevar/contracts';
import type { Service } from '@dejatellevar/contracts';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { searchServices } from '../../lib/api';
import { colors } from '../../lib/theme';

/** M01 — Explorar. Consume la misma API tipada que la web. */
export default function ExplorarScreen() {
  const [query, setQuery] = useState('');
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (q: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await searchServices(q);
      setServices(res.data);
    } catch {
      setError('No pudimos cargar el catálogo. Revisa que la API esté corriendo.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load('');
  }, [load]);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.searchRow}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={() => load(query)}
          placeholder="Mamona, masaje, rafting..."
          placeholderTextColor={colors.humo}
          style={styles.input}
          returnKeyType="search"
        />
      </View>

      {loading ? (
        <ActivityIndicator color={colors.violeta} style={{ marginTop: 32 }} />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : services.length === 0 ? (
        <Text style={styles.empty}>
          No hay servicios. Corre pnpm db:seed y arranca la web para exponer la API.
        </Text>
      ) : (
        <FlatList
          data={services}
          keyExtractor={(s) => s.id}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card}>
              <Text style={styles.name}>{item.name}</Text>
              {item.short_description ? (
                <Text style={styles.desc} numberOfLines={2}>
                  {item.short_description}
                </Text>
              ) : null}
              <View style={styles.cardFooter}>
                <Text style={styles.price}>
                  {item.base_price ? formatMoney(item.base_price) : 'Por cotización'}
                </Text>
                {item.fidelity.value !== null && item.fidelity.sampleSize >= 5 ? (
                  <Text style={styles.fidelity}>
                    Fidelidad {item.fidelity.value > 0 ? '+' : ''}
                    {item.fidelity.value.toFixed(1)}
                  </Text>
                ) : (
                  <Text style={styles.fidelityMuted}>Sin datos</Text>
                )}
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paja },
  searchRow: { padding: 16, backgroundColor: colors.noche },
  input: {
    height: 44,
    borderRadius: 6,
    backgroundColor: colors.paja,
    paddingHorizontal: 12,
    color: colors.carbon,
    fontSize: 16,
  },
  card: {
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.niebla,
    backgroundColor: '#fff',
    padding: 16,
    gap: 6,
  },
  name: { fontSize: 18, fontWeight: '600', color: colors.carbon },
  desc: { fontSize: 14, color: colors.humo },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  price: { fontFamily: 'monospace', color: colors.carbon },
  fidelity: { color: colors.brote, fontWeight: '600' },
  fidelityMuted: { color: colors.humo },
  error: { margin: 24, color: colors.tinto },
  empty: { margin: 24, color: colors.humo },
});
