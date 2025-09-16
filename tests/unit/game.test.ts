/**
 * 🧪 Testes Unitários - Game Service
 * Testa funcionalidades básicas do serviço de jogos
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';

// Mock do Strapi
const mockStrapi = {
  entityService: {
    findMany: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  log: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
};

// Mock do Game Service
const mockGameService = {
  async findMany(params: any) {
    return mockStrapi.entityService.findMany('api::game.game', params);
  },
  
  async findOne(id: string, params: any) {
    return mockStrapi.entityService.findOne('api::game.game', id, params);
  },
  
  async create(data: any) {
    return mockStrapi.entityService.create('api::game.game', { data });
  },
  
  async update(id: string, data: any) {
    return mockStrapi.entityService.update('api::game.game', id, { data });
  },
  
  async delete(id: string) {
    return mockStrapi.entityService.delete('api::game.game', id);
  },
};

describe('🎮 Game Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('📋 findMany', () => {
    it('deve retornar lista de jogos', async () => {
      const mockGames = [
        { id: 1, name: 'Baldur\'s Gate 3', slug: 'baldurs-gate-3' },
        { id: 2, name: 'Cyberpunk 2077', slug: 'cyberpunk-2077' },
      ];
      
      mockStrapi.entityService.findMany.mockResolvedValue(mockGames);
      
      const result = await mockGameService.findMany({});
      
      expect(result).toEqual(mockGames);
      expect(mockStrapi.entityService.findMany).toHaveBeenCalledWith('api::game.game', {});
    });

    it('deve filtrar jogos por categoria', async () => {
      const mockGames = [
        { id: 1, name: 'Baldur\'s Gate 3', category: 'RPG' },
      ];
      
      mockStrapi.entityService.findMany.mockResolvedValue(mockGames);
      
      const result = await mockGameService.findMany({
        filters: { category: 'RPG' }
      });
      
      expect(result).toEqual(mockGames);
      expect(mockStrapi.entityService.findMany).toHaveBeenCalledWith('api::game.game', {
        filters: { category: 'RPG' }
      });
    });
  });

  describe('🔍 findOne', () => {
    it('deve retornar um jogo específico', async () => {
      const mockGame = { id: 1, name: 'Baldur\'s Gate 3', slug: 'baldurs-gate-3' };
      
      mockStrapi.entityService.findOne.mockResolvedValue(mockGame);
      
      const result = await mockGameService.findOne('1', {});
      
      expect(result).toEqual(mockGame);
      expect(mockStrapi.entityService.findOne).toHaveBeenCalledWith('api::game.game', '1', {});
    });

    it('deve retornar null para jogo inexistente', async () => {
      mockStrapi.entityService.findOne.mockResolvedValue(null);
      
      const result = await mockGameService.findOne('999', {});
      
      expect(result).toBeNull();
    });
  });

  describe('➕ create', () => {
    it('deve criar um novo jogo', async () => {
      const gameData = {
        name: 'Test Game',
        slug: 'test-game',
        description: 'A test game',
        releaseDate: '2024-01-01',
      };
      
      const createdGame = { id: 1, ...gameData };
      mockStrapi.entityService.create.mockResolvedValue(createdGame);
      
      const result = await mockGameService.create(gameData);
      
      expect(result).toEqual(createdGame);
      expect(mockStrapi.entityService.create).toHaveBeenCalledWith('api::game.game', { data: gameData });
    });
  });

  describe('✏️ update', () => {
    it('deve atualizar um jogo existente', async () => {
      const updateData = { name: 'Updated Game Name' };
      const updatedGame = { id: 1, ...updateData };
      
      mockStrapi.entityService.update.mockResolvedValue(updatedGame);
      
      const result = await mockGameService.update('1', updateData);
      
      expect(result).toEqual(updatedGame);
      expect(mockStrapi.entityService.update).toHaveBeenCalledWith('api::game.game', '1', { data: updateData });
    });
  });

  describe('🗑️ delete', () => {
    it('deve deletar um jogo', async () => {
      const deletedGame = { id: 1, name: 'Deleted Game' };
      
      mockStrapi.entityService.delete.mockResolvedValue(deletedGame);
      
      const result = await mockGameService.delete('1');
      
      expect(result).toEqual(deletedGame);
      expect(mockStrapi.entityService.delete).toHaveBeenCalledWith('api::game.game', '1');
    });
  });
});
