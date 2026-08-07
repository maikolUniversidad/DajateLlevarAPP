import type { ContentScrapingProvider, ScrapedProfile } from '@dejatellevar/core';
import { describe, expect, it } from 'vitest';
import { createContentScraper } from './index.js';

const fakeProfile: ScrapedProfile = {
  network: 'tiktok',
  networkUserId: 'x',
  handle: '@x',
  followers: 10,
  items: [],
};

describe('createContentScraper — enrutado por red', () => {
  it('delega las redes no soportadas en el fallback', async () => {
    const fallback: ContentScrapingProvider = {
      fetchProfile: async () => fakeProfile,
    };
    const scraper = createContentScraper({ fallback });
    const p = await scraper.fetchProfile({ network: 'tiktok', url: 'https://tiktok.com/@x' });
    expect(p).toBe(fakeProfile);
  });

  it('lanza para redes no soportadas si no hay fallback', async () => {
    const scraper = createContentScraper();
    await expect(
      scraper.fetchProfile({ network: 'instagram', url: 'https://instagram.com/x' }),
    ).rejects.toThrow(/requiere API oficial o un servicio/);
  });
});
