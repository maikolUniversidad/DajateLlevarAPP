import { RegisterCreatorSchema } from '@dejatellevar/contracts';
import type {
  CreatorContentInsight,
  CreatorContentItem,
  CreatorProfile,
  CreatorSocialLink,
} from '@dejatellevar/core';
import {
  activateCreatorProfile,
  analyzeCreatorContent,
  connectSocialLinks,
} from '@dejatellevar/core';
import {
  makeAccountRepository,
  makeConsentRepository,
  makeCreatorContentRepository,
  makeCreatorRepository,
  makeEventPublisher,
  makePolicyVersionRepository,
  makeStubContentAnalyzer,
  makeStubContentScraper,
  makeStubTranscriber,
  systemClock,
} from '@dejatellevar/db';
import { Hono } from 'hono';
import type { ApiDeps, ApiEnv } from '../context.js';
import { domainStatus, errorResponse } from '../errors.js';
import { requireAuth } from '../middleware.js';

function evidenceFrom(c: {
  req: { header: (name: string) => string | undefined };
}): { ipAddress: string | null; userAgent: string | null } {
  return {
    ipAddress:
      c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ?? c.req.header('x-real-ip') ?? null,
    userAgent: c.req.header('user-agent') ?? null,
  };
}

function mapLink(l: CreatorSocialLink) {
  return {
    id: l.id,
    network: l.network,
    url: l.url,
    handle: l.handle,
    status: l.status,
    last_analyzed_at: l.lastAnalyzedAt ? l.lastAnalyzedAt.toISOString() : null,
  };
}

function mapInsight(i: CreatorContentInsight) {
  return {
    status: i.status,
    analyzed_at: i.analyzedAt ? i.analyzedAt.toISOString() : null,
    items_analyzed: i.itemsAnalyzed,
    total_views: i.totalViews,
    avg_views: i.avgViews,
    avg_engagement_rate: i.avgEngagementRate,
    suggested_categories: i.suggestedCategories,
    top_topics: i.topTopics,
    audience: {
      primary_age_range: i.audience.primaryAgeRange,
      top_cities: i.audience.topCities,
      languages: i.audience.languages,
      interests: i.audience.interests,
    },
    brand_safety: i.brandSafety,
    networks: i.networks.map((n) => ({
      network: n.network,
      followers: n.followers,
      avg_views: n.avgViews,
      items: n.items,
    })),
  };
}

function mapItem(it: CreatorContentItem) {
  return {
    id: it.id,
    network: it.network,
    kind: it.kind,
    url: it.url,
    title: it.title,
    views: it.views,
    likes: it.likes,
    comments: it.comments,
    shares: it.shares,
    duration_seconds: it.durationSeconds,
    published_at: it.publishedAt ? it.publishedAt.toISOString() : null,
    transcript: it.transcript,
    language: it.language,
    topics: it.topics,
  };
}

function mapMyCreator(
  p: CreatorProfile,
  links: CreatorSocialLink[],
  insight: CreatorContentInsight | null,
) {
  return {
    id: p.id,
    account_id: p.accountId,
    handle: p.handle,
    bio: p.bio,
    categories: p.categories,
    cities: p.cities,
    languages: p.languages,
    is_accepting_work: p.isAcceptingWork,
    total_followers: p.totalFollowers,
    avg_engagement_rate: p.avgEngagementRate,
    fidelity_index: p.fidelityIndex,
    created_at: p.createdAt.toISOString(),
    social_links: links.map(mapLink),
    insight: insight ? mapInsight(insight) : null,
  };
}

export function creatorRoutes(deps: ApiDeps) {
  const app = new Hono<ApiEnv>();
  const { db } = deps;
  const accounts = makeAccountRepository(db);
  const creators = makeCreatorRepository(db);
  const content = makeCreatorContentRepository(db);
  const policies = makePolicyVersionRepository(db);
  const consents = makeConsentRepository(db);
  const events = makeEventPublisher(db);
  // Adaptadores STUB del scraping/transcripción/clasificación. Se reemplazan por
  // los reales vía inyección sin tocar el dominio (regla de oro de portabilidad).
  const scraper = makeStubContentScraper();
  const transcriber = makeStubTranscriber();
  const analyzer = makeStubContentAnalyzer();

  app.use('*', requireAuth);

  // POST /v1/creators — alta de creador: activa perfil + registra enlaces sociales.
  app.post('/', async (c) => {
    const accountId = c.get('accountId')!;
    const body = RegisterCreatorSchema.parse(await c.req.json());

    const activated = await activateCreatorProfile(
      { accounts, creators, events },
      {
        accountId,
        handle: body.handle,
        bio: body.bio ?? null,
        categories: body.categories,
        cities: body.cities,
      },
    );
    if (!activated.ok) {
      return errorResponse(
        c,
        domainStatus(activated.error.code),
        activated.error.code,
        activated.error.message,
      );
    }

    const linked = await connectSocialLinks(
      { creators, content, policies, consents, events },
      { accountId, socialLinks: body.social_links, evidence: evidenceFrom(c) },
    );
    if (!linked.ok) {
      return errorResponse(
        c,
        domainStatus(linked.error.code),
        linked.error.code,
        linked.error.message,
      );
    }

    return c.json(mapMyCreator(activated.value, linked.value, null), 201);
  });

  // GET /v1/creators/me — perfil del creador con enlaces e insight.
  app.get('/me', async (c) => {
    const accountId = c.get('accountId')!;
    const profile = await creators.findByAccountId(accountId);
    if (!profile) {
      return errorResponse(c, 404, 'CREATOR_NOT_FOUND', 'No tienes un perfil de creador');
    }
    const links = await content.listSocialLinks(profile.id);
    const insight = await content.getInsight(profile.id);
    return c.json(mapMyCreator(profile, links, insight));
  });

  // POST /v1/creators/me/analyze — dispara el scraping + transcripción + clasificación.
  app.post('/me/analyze', async (c) => {
    const accountId = c.get('accountId')!;
    const result = await analyzeCreatorContent(
      { creators, content, consents, scraper, transcriber, analyzer, events, clock: systemClock },
      { accountId },
    );
    if (!result.ok) {
      return errorResponse(
        c,
        domainStatus(result.error.code),
        result.error.code,
        result.error.message,
      );
    }
    return c.json(mapInsight(result.value));
  });

  // GET /v1/creators/me/content — piezas analizadas (con transcripción y vistas).
  app.get('/me/content', async (c) => {
    const accountId = c.get('accountId')!;
    const profile = await creators.findByAccountId(accountId);
    if (!profile) {
      return errorResponse(c, 404, 'CREATOR_NOT_FOUND', 'No tienes un perfil de creador');
    }
    const items = await content.listContentItems(profile.id);
    return c.json({ data: items.map(mapItem) });
  });

  return app;
}
