/**
 * Documento OpenAPI 3.1 mínimo generado para los endpoints ya implementados.
 * Se sirve en GET /v1/openapi.json y crecerá con cada módulo.
 */
export function openApiDocument() {
  return {
    openapi: '3.1.0',
    info: {
      title: 'DéjateLlevar API',
      version: '0.1.0',
      description:
        'API de la plataforma DéjateLlevar. Dinero en centavos; fechas ISO 8601 con zona.',
    },
    servers: [{ url: '/api' }],
    paths: {
      '/v1/services': {
        get: {
          summary: 'Buscar servicios publicados',
          parameters: [
            { name: 'q', in: 'query', schema: { type: 'string' } },
            { name: 'category', in: 'query', schema: { type: 'string' } },
            { name: 'city', in: 'query', schema: { type: 'string' } },
            { name: 'price_min', in: 'query', schema: { type: 'integer' } },
            { name: 'price_max', in: 'query', schema: { type: 'integer' } },
            { name: 'fidelity_min', in: 'query', schema: { type: 'number' } },
            {
              name: 'sort',
              in: 'query',
              schema: {
                type: 'string',
                enum: ['relevance', 'price_asc', 'price_desc', 'fidelity', 'rating', 'newest'],
              },
            },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          ],
          responses: {
            '200': {
              description: 'Lista paginada por cursor',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: { type: 'array', items: { $ref: '#/components/schemas/Service' } },
                      next_cursor: { type: ['string', 'null'] },
                    },
                  },
                },
              },
            },
          },
        },
        post: {
          summary: 'Crear un servicio',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/CreateService' } },
            },
          },
          responses: { '201': { description: 'Servicio creado (borrador)' } },
        },
      },
      '/v1/services/{id}': {
        get: {
          summary: 'Obtener un servicio por id',
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
          ],
          responses: { '200': { description: 'Servicio' }, '404': { description: 'No existe' } },
        },
      },
      '/v1/creators': {
        post: {
          summary: 'Alta de creador: activa el perfil y registra enlaces de redes',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/RegisterCreator' } },
            },
          },
          responses: {
            '201': { description: 'Creador registrado con sus enlaces' },
            '409': { description: 'Handle tomado o perfil ya existente' },
            '422': { description: 'Falta consentimiento de IA o datos inválidos' },
          },
        },
      },
      '/v1/creators/me': {
        get: {
          summary: 'Perfil del creador autenticado con enlaces e insight',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': { description: 'Perfil, enlaces e insight' },
            '404': { description: 'La cuenta no tiene perfil de creador' },
          },
        },
      },
      '/v1/creators/me/analyze': {
        post: {
          summary: 'Analiza el contenido: scraping + transcripción + clasificación',
          description:
            'Raspa las redes registradas, transcribe los videos, cuenta vistas y deriva ' +
            'categoría y audiencia. Requiere consentimiento ai_processing (Ley 1581).',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': { description: 'Insight calculado del creador' },
            '422': { description: 'Falta consentimiento o no hay enlaces' },
            '502': { description: 'Ninguna red pudo analizarse' },
          },
        },
      },
      '/v1/creators/me/content': {
        get: {
          summary: 'Piezas de contenido analizadas (con transcripción y vistas)',
          security: [{ bearerAuth: [] }],
          responses: { '200': { description: 'Lista de piezas analizadas' } },
        },
      },
      '/v1/admin/me': {
        get: {
          summary: 'Rol y permisos del staff de plataforma autenticado',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': { description: 'Rol y permisos efectivos' },
            '403': { description: 'No es staff de plataforma' },
          },
        },
      },
      '/v1/admin/audit': {
        get: {
          summary: 'Registro de auditoría de acciones (permiso audit:read)',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'actor_account_id', in: 'query', schema: { type: 'string', format: 'uuid' } },
            { name: 'resource_type', in: 'query', schema: { type: 'string' } },
            { name: 'action', in: 'query', schema: { type: 'string' } },
            { name: 'from', in: 'query', schema: { type: 'string', format: 'date-time' } },
            { name: 'to', in: 'query', schema: { type: 'string', format: 'date-time' } },
            { name: 'cursor', in: 'query', schema: { type: 'string' } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          ],
          responses: { '200': { description: 'Lista paginada por cursor' } },
        },
      },
      '/v1/admin/events': {
        get: {
          summary: 'Explorador de eventos de dominio (permiso events:read)',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'event_type', in: 'query', schema: { type: 'string' } },
            { name: 'aggregate_type', in: 'query', schema: { type: 'string' } },
            { name: 'aggregate_id', in: 'query', schema: { type: 'string', format: 'uuid' } },
            { name: 'organization_id', in: 'query', schema: { type: 'string', format: 'uuid' } },
            { name: 'cursor', in: 'query', schema: { type: 'string' } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          ],
          responses: { '200': { description: 'Lista paginada por cursor' } },
        },
      },
      '/v1/admin/staff': {
        get: {
          summary: 'Listar el staff de plataforma (permiso roles:manage)',
          security: [{ bearerAuth: [] }],
          responses: { '200': { description: 'Lista de staff con permisos efectivos' } },
        },
        post: {
          summary: 'Asignar o cambiar el rol de plataforma de una cuenta',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/AssignPlatformRole' } },
            },
          },
          responses: {
            '201': { description: 'Rol asignado' },
            '403': { description: 'Sin permiso roles:manage' },
          },
        },
      },
      '/v1/admin/staff/{accountId}': {
        delete: {
          summary: 'Revocar el rol de plataforma de una cuenta',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'accountId',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
            },
          ],
          responses: { '200': { description: 'Revocado' } },
        },
      },
    },
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer' },
      },
      schemas: {
        Money: {
          type: 'object',
          properties: {
            amount: { type: 'integer', description: 'Centavos' },
            currency: { type: 'string', enum: ['COP', 'USD'] },
          },
          required: ['amount', 'currency'],
        },
        Service: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            base_price: { oneOf: [{ $ref: '#/components/schemas/Money' }, { type: 'null' }] },
            modality: { type: 'string' },
            status: { type: 'string' },
            fidelity: {
              type: 'object',
              properties: { value: { type: ['number', 'null'] }, sampleSize: { type: 'integer' } },
            },
          },
        },
        CreateService: {
          type: 'object',
          required: ['organization_id', 'name', 'description', 'category_id', 'modality'],
          properties: {
            organization_id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            description: { type: 'string' },
            category_id: { type: 'string', format: 'uuid' },
            modality: { type: 'string', enum: ['scheduled', 'capacity', 'on_demand', 'digital'] },
            base_price: { $ref: '#/components/schemas/Money' },
          },
        },
        RegisterCreator: {
          type: 'object',
          required: ['handle', 'social_links', 'accept_ai_processing'],
          properties: {
            handle: { type: 'string', minLength: 3, maxLength: 60 },
            bio: { type: 'string', maxLength: 500 },
            categories: { type: 'array', items: { type: 'string' } },
            cities: { type: 'array', items: { type: 'string' } },
            social_links: {
              type: 'array',
              minItems: 1,
              maxItems: 6,
              items: {
                type: 'object',
                required: ['network', 'url'],
                properties: {
                  network: {
                    type: 'string',
                    enum: ['tiktok', 'instagram', 'youtube', 'facebook', 'x', 'twitch'],
                  },
                  url: { type: 'string', format: 'uri' },
                },
              },
            },
            accept_ai_processing: {
              type: 'boolean',
              description: 'Consentimiento explícito de análisis con IA (Ley 1581). Debe ser true.',
            },
          },
        },
        CreatorInsight: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['pending', 'running', 'completed', 'failed'],
            },
            items_analyzed: { type: 'integer' },
            total_views: { type: 'integer' },
            avg_views: { type: 'number' },
            avg_engagement_rate: { type: ['number', 'null'] },
            suggested_categories: { type: 'array', items: { type: 'string' } },
            top_topics: { type: 'array', items: { type: 'string' } },
            brand_safety: { type: 'string', enum: ['safe', 'review', 'unsafe'] },
          },
        },
        AssignPlatformRole: {
          type: 'object',
          required: ['account_id', 'role'],
          properties: {
            account_id: { type: 'string', format: 'uuid' },
            role: {
              type: 'string',
              enum: ['super_admin', 'moderator', 'finance', 'support', 'analyst'],
            },
            extra_permissions: { type: 'array', items: { type: 'string' } },
          },
        },
      },
    },
  } as const;
}
