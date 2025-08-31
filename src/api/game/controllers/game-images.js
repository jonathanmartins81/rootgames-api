'use strict';

const fs = require('fs');
const path = require('path');

module.exports = {
  // Buscar imagem de capa de um jogo
  async getGameCover(ctx) {
    try {
      const { gameName } = ctx.params;

      if (!gameName) {
        return ctx.badRequest('Nome do jogo é obrigatório');
      }

      // Normalizar nome do jogo para corresponder ao diretório
      const normalizedName = gameName
        .toLowerCase()
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .replace(/\s+/g, '_');

      // Caminho para o diretório de uploads
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads');

      // Procurar diretório correspondente
      const items = fs.readdirSync(uploadsDir);
      const gameDir = items.find(item => {
        if (item === '.' || item === '..') return false;
        const itemPath = path.join(uploadsDir, item);
        if (!fs.statSync(itemPath).isDirectory()) return false;

        const normalizedDir = item.toLowerCase();
        return (
          normalizedDir.includes(normalizedName) ||
          normalizedName.includes(normalizedDir) ||
          normalizedDir.includes(normalizedName.replace(/_/g, ''))
        );
      });

      if (!gameDir) {
        return ctx.notFound('Diretório do jogo não encontrado');
      }

      const gameDirPath = path.join(uploadsDir, gameDir);
      const dirContents = fs.readdirSync(gameDirPath);

      // Procurar imagem de capa
      const coverImage = dirContents.find(item => {
        const itemName = item.toLowerCase();
        return (
          itemName.includes('cover') ||
          itemName.includes('capa') ||
          itemName.includes('header') ||
          itemName.includes('main') ||
          itemName.endsWith('.jpg') ||
          itemName.endsWith('.png') ||
          itemName.endsWith('.jpeg')
        );
      });

      if (!coverImage) {
        return ctx.notFound('Imagem de capa não encontrada');
      }

      const imagePath = path.join(gameDirPath, coverImage);

      // Servir a imagem
      ctx.type = 'image/jpeg';
      ctx.body = fs.createReadStream(imagePath);
    } catch (error) {
      ctx.internalServerError(`Erro ao buscar imagem: ${error.message}`);
    }
  },

  // Buscar galeria de imagens de um jogo
  async getGameGallery(ctx) {
    try {
      const { gameName } = ctx.params;

      if (!gameName) {
        return ctx.badRequest('Nome do jogo é obrigatório');
      }

      // Normalizar nome do jogo para corresponder ao diretório
      const normalizedName = gameName
        .toLowerCase()
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .replace(/\s+/g, '_');

      // Caminho para o diretório de uploads
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads');

      // Procurar diretório correspondente
      const items = fs.readdirSync(uploadsDir);
      const gameDir = items.find(item => {
        if (item === '.' || item === '..') return false;
        const itemPath = path.join(uploadsDir, item);
        if (!fs.statSync(itemPath).isDirectory()) return false;

        const normalizedDir = item.toLowerCase();
        return (
          normalizedDir.includes(normalizedName) ||
          normalizedName.includes(normalizedDir) ||
          normalizedDir.includes(normalizedName.replace(/_/g, ''))
        );
      });

      if (!gameDir) {
        return ctx.notFound('Diretório do jogo não encontrado');
      }

      const gameDirPath = path.join(uploadsDir, gameDir);
      const dirContents = fs.readdirSync(gameDirPath);

      // Filtrar apenas imagens
      const images = dirContents.filter(item => {
        const itemName = item.toLowerCase();
        return itemName.endsWith('.jpg') || itemName.endsWith('.png') || itemName.endsWith('.jpeg');
      });

      if (images.length === 0) {
        return ctx.notFound('Nenhuma imagem encontrada');
      }

      // Retornar lista de imagens
      ctx.body = {
        success: true,
        game: gameName,
        directory: gameDir,
        images: images.map(image => ({
          filename: image,
          url: `/uploads/${gameDir}/${image}`,
          type: image.toLowerCase().includes('cover') ? 'cover' : 'gallery',
        })),
        total: images.length,
      };
    } catch (error) {
      ctx.internalServerError(`Erro ao buscar galeria: ${error.message}`);
    }
  },

  // Listar todos os jogos com status de imagens
  async getGamesImageStatus(ctx) {
    try {
      // Buscar todos os jogos do Strapi
      const games = await strapi.entityService.findMany('api::game.game', {
        fields: ['id', 'name'],
        sort: { name: 'ASC' },
      });

      // Caminho para o diretório de uploads
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
      const uploadDirs = fs.readdirSync(uploadsDir).filter(item => {
        if (item === '.' || item === '..') return false;
        const itemPath = path.join(uploadsDir, item);
        return fs.statSync(itemPath).isDirectory();
      });

      // Mapear status das imagens para cada jogo
      const gamesWithStatus = games.map(game => {
        const normalizedName = game.name
          .toLowerCase()
          .replace(/[^a-zA-Z0-9\s]/g, '')
          .replace(/\s+/g, '_');

        const hasUploadDir = uploadDirs.some(dir => {
          const normalizedDir = dir.toLowerCase();
          return (
            normalizedDir.includes(normalizedName) ||
            normalizedName.includes(normalizedDir) ||
            normalizedDir.includes(normalizedName.replace(/_/g, ''))
          );
        });

        let imageCount = 0;
        let hasCover = false;

        if (hasUploadDir) {
          const gameDir = uploadDirs.find(dir => {
            const normalizedDir = dir.toLowerCase();
            return (
              normalizedDir.includes(normalizedName) ||
              normalizedName.includes(normalizedDir) ||
              normalizedDir.includes(normalizedName.replace(/_/g, ''))
            );
          });

          if (gameDir) {
            const gameDirPath = path.join(uploadsDir, gameDir);
            const dirContents = fs.readdirSync(gameDirPath);
            const images = dirContents.filter(item => {
              const itemName = item.toLowerCase();
              return itemName.endsWith('.jpg') || itemName.endsWith('.png') || itemName.endsWith('.jpeg');
            });

            imageCount = images.length;
            hasCover = images.some(
              image =>
                image.toLowerCase().includes('cover') ||
                image.toLowerCase().includes('capa') ||
                image.toLowerCase().includes('header') ||
                image.toLowerCase().includes('main')
            );
          }
        }

        return {
          id: game.id,
          name: game.name,
          hasUploadDir,
          imageCount,
          hasCover,
          status: hasUploadDir && imageCount > 0 ? 'complete' : hasUploadDir && imageCount === 0 ? 'empty' : 'missing',
        };
      });

      // Estatísticas
      const stats = {
        total: gamesWithStatus.length,
        complete: gamesWithStatus.filter(g => g.status === 'complete').length,
        empty: gamesWithStatus.filter(g => g.status === 'empty').length,
        missing: gamesWithStatus.filter(g => g.status === 'missing').length,
        withCover: gamesWithStatus.filter(g => g.hasCover).length,
      };

      ctx.body = {
        success: true,
        stats,
        games: gamesWithStatus,
      };
    } catch (error) {
      ctx.internalServerError(`Erro ao buscar status das imagens: ${error.message}`);
    }
  },
};
