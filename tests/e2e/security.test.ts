/**
 * 🧪 Testes E2E - Segurança
 * Testa funcionalidades de segurança end-to-end
 */

import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import request from "supertest";
import { createStrapiInstance } from "@strapi/strapi";

let strapi: any;
let app: any;

describe("🛡️ Security E2E Tests", () => {
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

  describe("🔒 Rate Limiting", () => {
    it("deve aplicar rate limiting após muitas requisições", async () => {
      const promises = [];

      // Fazer 150 requisições (limite é 100/min)
      for (let i = 0; i < 150; i++) {
        promises.push(
          request(app)
            .get("/api/games")
            .expect((res) => {
              if (i >= 100) {
                expect(res.status).toBe(429);
              } else {
                expect(res.status).toBe(200);
              }
            })
        );
      }

      await Promise.all(promises);
    });
  });

  describe("🛡️ Security Headers", () => {
    it("deve incluir headers de segurança", async () => {
      const response = await request(app).get("/api/games").expect(200);

      expect(response.headers).toHaveProperty("x-content-type-options");
      expect(response.headers).toHaveProperty("x-frame-options");
      expect(response.headers).toHaveProperty("x-xss-protection");
      expect(response.headers).toHaveProperty("referrer-policy");
      expect(response.headers["x-content-type-options"]).toBe("nosniff");
      expect(response.headers["x-frame-options"]).toBe("DENY");
    });
  });

  describe("🔑 API Key Authentication", () => {
    it("deve bloquear acesso sem API key", async () => {
      await request(app).get("/api/admin/system-info").expect(401);
    });

    it("deve bloquear acesso com API key inválida", async () => {
      await request(app)
        .get("/api/admin/system-info")
        .set("X-API-Key", "invalid-key")
        .expect(401);
    });

    it("deve permitir acesso com API key válida", async () => {
      await request(app)
        .get("/api/admin/system-info")
        .set("X-API-Key", "rootgames-admin-key-2024")
        .expect(200);
    });
  });

  describe("📁 Upload Validation", () => {
    it("deve rejeitar arquivos muito grandes", async () => {
      const largeFile = Buffer.alloc(11 * 1024 * 1024); // 11MB

      await request(app)
        .post("/api/upload")
        .attach("files", largeFile, "large-file.jpg")
        .expect(400);
    });

    it("deve rejeitar tipos de arquivo inválidos", async () => {
      const maliciousFile = Buffer.from("malicious content");

      await request(app)
        .post("/api/upload")
        .attach("files", maliciousFile, "malicious.exe")
        .expect(400);
    });

    it("deve aceitar arquivos válidos", async () => {
      const validImage = Buffer.from("valid image content");

      await request(app)
        .post("/api/upload")
        .attach("files", validImage, "valid.jpg")
        .expect(200);
    });
  });

  describe("🚨 XSS Protection", () => {
    it("deve sanitizar scripts maliciosos", async () => {
      const maliciousQuery = '<script>alert("xss")</script>';

      const response = await request(app)
        .get(`/api/games?search=${encodeURIComponent(maliciousQuery)}`)
        .expect(200);

      // Verificar se o script foi sanitizado
      expect(response.text).not.toContain("<script>");
      expect(response.text).not.toContain("alert");
    });

    it("deve sanitizar JavaScript URLs", async () => {
      const jsUrl = 'javascript:alert("xss")';

      const response = await request(app)
        .get(`/api/games?search=${encodeURIComponent(jsUrl)}`)
        .expect(200);

      expect(response.text).not.toContain("javascript:");
    });
  });

  describe("🔍 SQL Injection Protection", () => {
    it("deve proteger contra SQL injection", async () => {
      const sqlInjection = "'; DROP TABLE games; --";

      const response = await request(app)
        .get(`/api/games?search=${encodeURIComponent(sqlInjection)}`)
        .expect(200);

      // Verificar se a query foi tratada como string literal
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe("📊 Security Logging", () => {
    it("deve registrar tentativas de acesso suspeitas", async () => {
      const suspiciousUserAgent = "sqlmap/1.0";

      await request(app)
        .get("/api/games")
        .set("User-Agent", suspiciousUserAgent)
        .expect(200);

      // Verificar se foi logado (implementar verificação de logs)
      // Este teste seria mais complexo em um ambiente real
    });
  });
});
