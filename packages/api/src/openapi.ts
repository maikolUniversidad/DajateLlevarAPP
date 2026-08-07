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
      },
    },
  } as const;
}
