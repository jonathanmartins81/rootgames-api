/**
 * Sistema de cache para otimizar performance das buscas de imagens
 *
 * Funcionalidades:
 * - Cache em memória para buscas recentes
 * - Cache persistente em arquivo JSON
 * - TTL (Time To Live) configurável
 * - Limpeza automática de cache expirado
 */

const fs = require('fs');
const path = require('path');

class ImageCache {
  constructor(options = {}) {
    this.memoryCache = new Map();
    this.cacheFile = options.cacheFile || path.join(process.cwd(), 'cache', 'image-cache.json');
    this.ttl = options.ttl || 24 * 60 * 60 * 1000; // 24 horas em ms
    this.maxSize = options.maxSize || 1000; // Máximo de itens em cache

    this.ensureCacheDir();
    this.loadCache();

    // Limpeza automática a cada hora
    setInterval(() => this.cleanup(), 60 * 60 * 1000);
  }

  ensureCacheDir() {
    const cacheDir = path.dirname(this.cacheFile);
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }
  }

  loadCache() {
    try {
      if (fs.existsSync(this.cacheFile)) {
        const data = JSON.parse(fs.readFileSync(this.cacheFile, 'utf8'));
        const now = Date.now();

        // Carregar apenas itens não expirados
        Object.entries(data).forEach(([key, value]) => {
          if (value.expiresAt > now) {
            this.memoryCache.set(key, value);
          }
        });

        console.log(`📦 Cache carregado: ${this.memoryCache.size} itens válidos`);
      }
    } catch (error) {
      console.log('⚠️ Erro ao carregar cache:', error.message);
    }
  }

  saveCache() {
    try {
      const data = {};
      this.memoryCache.forEach((value, key) => {
        data[key] = value;
      });

      fs.writeFileSync(this.cacheFile, JSON.stringify(data, null, 2));
    } catch (error) {
      console.log('⚠️ Erro ao salvar cache:', error.message);
    }
  }

  generateKey(gameName, source = 'all') {
    return `${gameName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${source}`;
  }

  get(gameName, source = 'all') {
    const key = this.generateKey(gameName, source);
    const cached = this.memoryCache.get(key);

    if (cached && cached.expiresAt > Date.now()) {
      console.log(`📦 Cache hit para: ${gameName} (${source})`);
      return cached.data;
    }

    if (cached) {
      this.memoryCache.delete(key);
    }

    console.log(`❌ Cache miss para: ${gameName} (${source})`);
    return null;
  }

  set(gameName, data, source = 'all', customTtl = null) {
    const key = this.generateKey(gameName, source);
    const ttl = customTtl || this.ttl;

    // Verificar se o cache está cheio
    if (this.memoryCache.size >= this.maxSize) {
      this.evictOldest();
    }

    const cacheItem = {
      data,
      source,
      createdAt: Date.now(),
      expiresAt: Date.now() + ttl,
      accessCount: 0
    };

    this.memoryCache.set(key, cacheItem);
    console.log(`💾 Cache salvo para: ${gameName} (${source}) - Expira em ${Math.round(ttl / (60 * 60 * 1000))}h`);

    // Salvar cache em arquivo periodicamente
    if (this.memoryCache.size % 10 === 0) {
      this.saveCache();
    }
  }

  evictOldest() {
    let oldestKey = null;
    let oldestTime = Date.now();

    this.memoryCache.forEach((value, key) => {
      if (value.createdAt < oldestTime) {
        oldestTime = value.createdAt;
        oldestKey = key;
      }
    });

    if (oldestKey) {
      this.memoryCache.delete(oldestKey);
      console.log(`🗑️ Item removido do cache: ${oldestKey}`);
    }
  }

  cleanup() {
    const now = Date.now();
    let removed = 0;

    this.memoryCache.forEach((value, key) => {
      if (value.expiresAt <= now) {
        this.memoryCache.delete(key);
        removed++;
      }
    });

    if (removed > 0) {
      console.log(`🧹 Cache limpo: ${removed} itens expirados removidos`);
      this.saveCache();
    }
  }

  invalidate(gameName, source = 'all') {
    const key = this.generateKey(gameName, source);
    if (this.memoryCache.delete(key)) {
      console.log(`🗑️ Cache invalidado para: ${gameName} (${source})`);
      this.saveCache();
    }
  }

  clear() {
    this.memoryCache.clear();
    this.saveCache();
    console.log('🗑️ Cache completamente limpo');
  }

  stats() {
    const now = Date.now();
    let expired = 0;
    let valid = 0;
    let totalAccess = 0;

    this.memoryCache.forEach((value) => {
      if (value.expiresAt <= now) {
        expired++;
      } else {
        valid++;
        totalAccess += value.accessCount;
      }
    });

    return {
      total: this.memoryCache.size,
      valid,
      expired,
      averageAccess: valid > 0 ? Math.round(totalAccess / valid) : 0,
      memoryUsage: process.memoryUsage().heapUsed,
      cacheFile: this.cacheFile
    };
  }

  // Método para buscar com cache inteligente
  async searchWithCache(searchFunction, gameName, source = 'all') {
    // Tentar cache primeiro
    const cached = this.get(gameName, source);
    if (cached) {
      return cached;
    }

    // Se não estiver em cache, fazer busca
    try {
      const result = await searchFunction(gameName);

      if (result && result.cover) {
        // Cache apenas resultados válidos
        this.set(gameName, result, source);
        return result;
      }

      return result;
    } catch (error) {
      console.log(`❌ Erro na busca para ${gameName}:`, error.message);
      return null;
    }
  }
}

// Instância global do cache
const imageCache = new ImageCache({
  ttl: 12 * 60 * 60 * 1000, // 12 horas
  maxSize: 2000,
  cacheFile: path.join(process.cwd(), 'cache', 'image-cache.json')
});

module.exports = imageCache;
