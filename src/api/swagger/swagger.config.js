/**
 * 📚 Configuração do Swagger/OpenAPI
 * Documentação automática da API RootGames
 */

const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: '🎮 RootGames API',
      version: '1.0.0',
      description: `
        Uma API robusta e segura para gerenciamento de jogos, construída com Strapi.
        
        ## 🚀 Funcionalidades
        - **Gerenciamento de Jogos**: CRUD completo com metadados detalhados
        - **Integração com APIs Externas**: RAWG, Steam, GOG, IGDB
        - **Sistema de Imagens**: Upload, busca e otimização automática
        - **Segurança Avançada**: Rate limiting, headers de segurança, validação
        - **Monitoramento**: Logs, métricas e alertas em tempo real
        
        ## 🔐 Autenticação
        Algumas rotas requerem autenticação por API Key. Inclua o header:
        \`X-API-Key: rootgames-admin-key-2024\`
        
        ## 📊 Rate Limiting
        - **API Geral**: 100 requisições por minuto
        - **Upload**: 10 requisições por minuto
        - **Admin**: 50 requisições por minuto
      `,
      contact: {
        name: 'RootGames Team',
        email: 'support@rootgames.com.br',
        url: 'https://github.com/jonathanmartins81/rootgames-api'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:1337',
        description: 'Servidor de Desenvolvimento'
      },
      {
        url: 'https://api.rootgames.com.br',
        description: 'Servidor de Produção'
      }
    ],
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
          description: 'API Key para autenticação'
        }
      },
      schemas: {
        Game: {
          type: 'object',
          required: ['name', 'slug'],
          properties: {
            id: {
              type: 'integer',
              description: 'ID único do jogo'
            },
            name: {
              type: 'string',
              description: 'Nome do jogo',
              example: 'Baldur\'s Gate 3'
            },
            slug: {
              type: 'string',
              description: 'Slug único do jogo',
              example: 'baldurs-gate-3'
            },
            description: {
              type: 'string',
              description: 'Descrição do jogo'
            },
            releaseDate: {
              type: 'string',
              format: 'date',
              description: 'Data de lançamento'
            },
            rating: {
              type: 'number',
              minimum: 0,
              maximum: 10,
              description: 'Avaliação do jogo'
            },
            cover: {
              type: 'object',
              description: 'Imagem de capa do jogo'
            },
            gallery: {
              type: 'array',
              items: {
                type: 'object'
              },
              description: 'Galeria de imagens do jogo'
            },
            category: {
              type: 'string',
              description: 'Categoria do jogo',
              enum: ['RPG', 'Action', 'Adventure', 'Strategy', 'Simulation', 'Sports', 'Racing', 'Fighting', 'Puzzle', 'Other']
            },
            platform: {
              type: 'string',
              description: 'Plataforma do jogo',
              enum: ['PC', 'PlayStation', 'Xbox', 'Nintendo Switch', 'Mobile', 'Other']
            },
            developer: {
              type: 'object',
              description: 'Desenvolvedor do jogo'
            },
            publisher: {
              type: 'object',
              description: 'Publicador do jogo'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Mensagem de erro'
            },
            code: {
              type: 'string',
              description: 'Código do erro'
            },
            details: {
              type: 'object',
              description: 'Detalhes adicionais do erro'
            }
          }
        },
        ImageSearchResult: {
          type: 'object',
          properties: {
            images: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  url: {
                    type: 'string',
                    description: 'URL da imagem'
                  },
                  source: {
                    type: 'string',
                    description: 'Fonte da imagem',
                    enum: ['rawg', 'steam', 'gog', 'igdb']
                  },
                  type: {
                    type: 'string',
                    description: 'Tipo da imagem',
                    enum: ['cover', 'screenshot', 'gallery']
                  },
                  width: {
                    type: 'integer',
                    description: 'Largura da imagem'
                  },
                  height: {
                    type: 'integer',
                    description: 'Altura da imagem'
                  }
                }
              }
            },
            total: {
              type: 'integer',
              description: 'Total de imagens encontradas'
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Games',
        description: 'Operações relacionadas a jogos'
      },
      {
        name: 'Images',
        description: 'Operações relacionadas a imagens de jogos'
      },
      {
        name: 'Admin',
        description: 'Operações administrativas (requer API Key)'
      },
      {
        name: 'Security',
        description: 'Operações de segurança e monitoramento'
      }
    ]
  },
  apis: [
    './src/api/*/routes/*.ts',
    './src/api/*/controllers/*.ts'
  ]
};

const specs = swaggerJSDoc(options);

module.exports = {
  specs,
  swaggerUi,
  options
};
