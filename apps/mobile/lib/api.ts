import type { Service } from '@dejatellevar/contracts';
import Constants from 'expo-constants';

/**
 * Cliente de API tipado, compartido con la web vía @dejatellevar/contracts.
 * La URL base sale de app.json > extra.apiUrl (o EXPO_PUBLIC_API_URL).
 */
const BASE_URL: string =
  process.env.EXPO_PUBLIC_API_URL ??
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ??
  'http://localhost:3000/api';

export type ServiceList = { data: Service[]; next_cursor: string | null };

export async function searchServices(query: string): Promise<ServiceList> {
  const params = new URLSearchParams();
  if (query) params.set('q', query);
  params.set('sort', 'fidelity');
  const res = await fetch(`${BASE_URL}/v1/services?${params.toString()}`);
  if (!res.ok) throw new Error(`API respondió ${res.status}`);
  return (await res.json()) as ServiceList;
}
