/**
 * 🧪 Testes de Integração - API Endpoints
 * Testa integração entre controllers, services e database
 */

import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
} from "@jest/globals";
import request from "supertest";
import { createStrapiInstance } from "@strapi/strapi";

let strapi: any;
let app: any;

describe("🌐 API Integration Tests", () => {
  beforeAll(async () => {
    // Inicializar Strapi para testes
    strapi = await createStrapiInstance({
      appDir: process.cwd(),
      distDir: process.cwd(),
    });

    await strapi.start();
    app = strapi.server.app;
  });

  afterAll(async () => {
    if (strapi) {
      await strapi.destroy();
    }
  });

  beforeEach(async () => {
    // Limpar dados de teste antes de cada teste
    await strapi.entityService.deleteMany("api::game.game", {});
  });

  describe("🎮 Games API", () => {
    describe("GET /api/games", () => {
      it("deve retornar lista de jogos", async () => {
        // Criar dados de teste
        await strapi.entityService.create("api::game.game", {
          data: {
            name: "Test Game 1",
            slug: "test-game-1",
            description: "A test game",
            releaseDate: "2024-01-01",
          },
        });

        const response = await request(app).get("/api/games").expect(200);

        expect(response.body.data).toHaveLength(1);
        expect(response.body.data[0].attributes.name).toBe("Test Game 1");
      });

      it("deve filtrar jogos por categoria", async () => {
        // Criar jogos de diferentes categorias
        await strapi.entityService.create("api::game.game", {
          data: {
            name: "RPG Game",
            slug: "rpg-game",
            category: "RPG",
          },
        });

        await strapi.entityService.create("api::game.game", {
          data: {
            name: "Action Game",
            slug: "action-game",
            category: "Action",
          },
        });

        const response = await request(app)
          .get("/api/games?filters[category][$eq]=RPG")
          .expect(200);

        expect(response.body.data).toHaveLength(1);
        expect(response.body.data[0].attributes.category).toBe("RPG");
      });

      it("deve paginar resultados", async () => {
        // Criar múltiplos jogos
        for (let i = 1; i <= 15; i++) {
          await strapi.entityService.create("api::game.game", {
            data: {
              name: `Game ${i}`,
              slug: `game-${i}`,
            },
          });
        }

        const response = await request(app)
          .get("/api/games?pagination[pageSize]=10")
          .expect(200);

        expect(response.body.data).toHaveLength(10);
        expect(response.body.meta.pagination.pageSize).toBe(10);
      });
    });

    describe("GET /api/games/:id", () => {
      it("deve retornar um jogo específico", async () => {
        const game = await strapi.entityService.create("api::game.game", {
          data: {
            name: "Specific Game",
            slug: "specific-game",
            description: "A specific game",
          },
        });

        const response = await request(app)
          .get(`/api/games/${game.id}`)
          .expect(200);

        expect(response.body.data.attributes.name).toBe("Specific Game");
        expect(response.body.data.attributes.slug).toBe("specific-game");
      });

      it("deve retornar 404 para jogo inexistente", async () => {
        await request(app).get("/api/games/999").expect(404);
      });
    });

    describe("POST /api/games", () => {
      it("deve criar um novo jogo", async () => {
        const gameData = {
          data: {
            name: "New Game",
            slug: "new-game",
            description: "A new game",
            releaseDate: "2024-01-01",
          },
        };

        const response = await request(app)
          .post("/api/games")
          .send(gameData)
          .expect(201);

        expect(response.body.data.attributes.name).toBe("New Game");
        expect(response.body.data.attributes.slug).toBe("new-game");
      });

      it("deve validar dados obrigatórios", async () => {
        const invalidData = {
          data: {
            // name ausente
            slug: "invalid-game",
          },
        };

        await request(app).post("/api/games").send(invalidData).expect(400);
      });
    });

    describe("PUT /api/games/:id", () => {
      it("deve atualizar um jogo existente", async () => {
        const game = await strapi.entityService.create("api::game.game", {
          data: {
            name: "Original Game",
            slug: "original-game",
          },
        });

        const updateData = {
          data: {
            name: "Updated Game",
            description: "Updated description",
          },
        };

        const response = await request(app)
          .put(`/api/games/${game.id}`)
          .send(updateData)
          .expect(200);

        expect(response.body.data.attributes.name).toBe("Updated Game");
        expect(response.body.data.attributes.description).toBe(
          "Updated description"
        );
      });
    });

    describe("DELETE /api/games/:id", () => {
      it("deve deletar um jogo", async () => {
        const game = await strapi.entityService.create("api::game.game", {
          data: {
            name: "Game to Delete",
            slug: "game-to-delete",
          },
        });

        await request(app).delete(`/api/games/${game.id}`).expect(200);

        // Verificar se foi deletado
        const deletedGame = await strapi.entityService.findOne(
          "api::game.game",
          game.id
        );
        expect(deletedGame).toBeNull();
      });
    });
  });

  describe("🖼️ Images API", () => {
    describe("GET /api/games/images/search", () => {
      it("deve buscar imagens de jogos", async () => {
        const response = await request(app)
          .get("/api/games/images/search?query=baldur")
          .expect(200);

        expect(response.body).toHaveProperty("images");
        expect(Array.isArray(response.body.images)).toBe(true);
      });

      it("deve retornar erro para query vazia", async () => {
        await request(app).get("/api/games/images/search").expect(400);
      });
    });
  });

  describe("🔐 Admin API", () => {
    describe("GET /api/admin/system-info", () => {
      it("deve retornar informações do sistema", async () => {
        const response = await request(app)
          .get("/api/admin/system-info")
          .set("X-API-Key", "rootgames-admin-key-2024")
          .expect(200);

        expect(response.body).toHaveProperty("system");
        expect(response.body.system).toHaveProperty("version");
        expect(response.body.system).toHaveProperty("uptime");
      });

      it("deve retornar 401 sem API key", async () => {
        await request(app).get("/api/admin/system-info").expect(401);
      });

      it("deve retornar 401 com API key inválida", async () => {
        await request(app)
          .get("/api/admin/system-info")
          .set("X-API-Key", "invalid-key")
          .expect(401);
      });
    });
  });
});
