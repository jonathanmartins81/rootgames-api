/**
 * 🧪 Testes de Performance - Load Testing
 * Testa performance e carga da API
 */

import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import request from "supertest";
import { createStrapiInstance } from "@strapi/strapi";

let strapi: any;
let app: any;

describe("📊 Performance Tests", () => {
  beforeAll(async () => {
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

  describe("⚡ Response Time", () => {
    it("deve responder em menos de 50ms", async () => {
      const start = Date.now();

      await request(app).get("/api/games").expect(200);

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(50);
    });

    it("deve responder busca de imagens em menos de 100ms", async () => {
      const start = Date.now();

      await request(app)
        .get("/api/games/images/search?query=baldur")
        .expect(200);

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(100);
    });
  });

  describe("🚀 Throughput", () => {
    it("deve suportar 100+ requisições por segundo", async () => {
      const start = Date.now();
      const promises = [];

      // Fazer 100 requisições simultâneas
      for (let i = 0; i < 100; i++) {
        promises.push(request(app).get("/api/games").expect(200));
      }

      await Promise.all(promises);

      const duration = Date.now() - start;
      const rps = 100 / (duration / 1000);

      expect(rps).toBeGreaterThan(100);
    });
  });

  describe("💾 Memory Usage", () => {
    it("deve manter uso de memória estável", async () => {
      const initialMemory = process.memoryUsage();

      // Fazer várias requisições
      for (let i = 0; i < 50; i++) {
        await request(app).get("/api/games").expect(200);
      }

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

      // Verificar se o aumento de memória não é excessivo (< 10MB)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });
  });

  describe("🔄 Concurrent Requests", () => {
    it("deve lidar com requisições concorrentes", async () => {
      const promises = [];

      // Fazer 50 requisições concorrentes
      for (let i = 0; i < 50; i++) {
        promises.push(request(app).get("/api/games").expect(200));
      }

      const results = await Promise.allSettled(promises);
      const successful = results.filter((r) => r.status === "fulfilled");

      expect(successful.length).toBe(50);
    });
  });
});
