#!/usr/bin/env node

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const STRAPI_URL = 'http://localhost:1337';
const UPLOADS_DIR = path.join(__dirname, '../public/uploads');

// Mapeamento de nomes de arquivos para nomes de jogos
const FILE_TO_GAME_MAPPING = {
  stardew_valley: 'Stardew Valley',
  dark_souls_iii: 'Dark Souls III',
  hades: 'Hades',
  disco_elysium: 'Disco Elysium',
  sid_meier_s_civilization_vi: "Sid Meier's Civilization VI",
  baldur_s_gate_3: "Baldur's Gate 3",
  control_ultimate_edition: 'Control Ultimate Edition',
  monster_hunter_world: 'Monster Hunter: World',
  hollow_knight: 'Hollow Knight',
  payday_2: 'Payday 2',
  hotline_miami: 'Hotline Miami',
  dragon_age_origins: 'Dragon Age: Origins',
  subnautica: 'Subnautica',
  shadowrun_trilogy: 'Shadowrun Trilogy',
  pillars_of_eternity: 'Pillars of Eternity',
  dead_cells: 'Dead Cells',
  age_of_wonders_iii: 'Age of Wonders III',
  into_the_breach: 'Into the Breach',
  ori_and_the_will_of_the_wisps: 'Ori and the Will of the Wisps',
  metro_exodus: 'Metro Exodus',
  outer_wilds: 'Outer Wilds',
  greedfall: 'GreedFall',
  torchlight_ii: 'Torchlight II',
  celeste: 'Celeste',
  project_zomboid: 'Project Zomboid',
  deus_ex_mankind_divided: 'Deus Ex: Mankind Divided',
  warhammer_vermintide_2: 'Warhammer: Vermintide 2',
  papers_please: 'Papers, Please',
  the_outer_worlds: 'The Outer Worlds',
  divinity_original_sin_2: 'Divinity: Original Sin 2',
  fallout_4_game_of_the_year_edition: 'Fallout 4: Game of the Year Edition',
  doom_eternal: 'DOOM Eternal',
  no_mans_sky: "No Man's Sky",
  the_long_dark: 'The Long Dark',
  frostpunk: 'Frostpunk',
  kingdom_come_deliverance: 'Kingdom Come: Deliverance',
  slay_the_spire: 'Slay the Spire',
  thief_gold_edition: 'THIEF Gold Edition',
  euro_truck_simulator_2: 'Euro Truck Simulator 2',
  system_shock_enhanced_edition: 'System Shock: Enhanced Edition',
  dead_island_definitive_edition: 'Dead Island Definitive Edition',
  shadow_warrior_2: 'Shadow Warrior 2',
  resident_evil_2: 'Resident Evil 2',
  frostpunk_game_of_the_year_edition: 'Frostpunk: Game of the Year Edition',
  divinity_original_sin_enhanced_edition: 'Divinity: Original Sin - Enhanced Edition',
  factorio: 'Factorio',
  pillars_of_eternity_ii_deadfire: 'Pillars of Eternity II: Deadfire',
  age_of_empires_ii_definitive_edition: 'Age of Empires II: Definitive Edition',
  jurassic_park_the_game: 'Jurassic Park: The Game',
  cyberpunk_2077: 'Cyberpunk 2077',
  the_witcher_3_wild_hunt: 'The Witcher 3: Wild Hunt',
  vampire_the_masquerade_bloodlines: 'Vampire: The Masquerade - Bloodlines',
  the_talos_principle: 'The Talos Principle',
};

// Função para extrair nome do jogo do nome do arquivo
function extractGameNameFromFilename(filename) {
  // Remover extensão e hashes
  const cleanName = filename
    .replace(/\.(jpg|jpeg|png|gif|webp)$/i, '')
    .replace(/_[a-f0-9]{32}$/, '') // Remove hash do final
    .replace(/^(large_|medium_|small_|thumbnail_)/, ''); // Remove prefixos de tamanho

  // Buscar correspondência no mapeamento
  for (const [filePattern, gameName] of Object.entries(FILE_TO_GAME_MAPPING)) {
    if (cleanName.includes(filePattern) || filePattern.includes(cleanName)) {
      return gameName;
    }
  }

  // Fallback: tentar extrair nome do jogo do nome do arquivo
  const words = cleanName.split('_');
  if (words.length >= 2) {
    return words
      .slice(0, 2)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  return null;
}

// Função para determinar o tipo de imagem
function getImageType(filename) {
  if (filename.includes('cover')) return 'cover';
  if (filename.includes('screenshot')) return 'gallery';
  if (filename.includes('artwork')) return 'gallery';
  if (filename.includes('background')) return 'gallery';
  return 'gallery'; // Padrão
}

// Função para buscar jogo por nome no Strapi
async function findGameByName(gameName) {
  try {
    const response = await axios.get(`${STRAPI_URL}/api/games?filters[name][$eq]=${encodeURIComponent(gameName)}`);

    if (response.data.data && response.data.data.length > 0) {
      return response.data.data[0];
    }

    return null;
  } catch (error) {
    console.log(`   ❌ Erro ao buscar jogo ${gameName}: ${error.message}`);
    return null;
  }
}

// Função para associar imagem ao jogo
async function associateImageToGame(gameId, imageId, imageType) {
  try {
    console.log(`   🔗 Associando ${imageType} (ID: ${imageId}) ao jogo ${gameId}...`);

    const updateData = {};

    if (imageType === 'cover') {
      updateData.cover = imageId;
    } else if (imageType === 'gallery') {
      // Buscar galeria atual
      const currentGame = await axios.get(`${STRAPI_URL}/api/games/${gameId}?populate=*`);
      const currentGallery = currentGame.data.data.gallery?.data || [];

      // Adicionar nova imagem à galeria (evitar duplicatas)
      if (!currentGallery.find(img => img.id === imageId)) {
        updateData.gallery = [...currentGallery.map(img => img.id), imageId];
      } else {
        console.log(`   ⚠️  Imagem ${imageId} já está na galeria`);
        return true;
      }
    }

    const response = await axios.put(`${STRAPI_URL}/api/games/${gameId}`, {
      data: updateData,
    });

    console.log(`   ✅ ${imageType} associado com sucesso!`);
    return true;
  } catch (error) {
    console.log(`   ❌ Erro ao associar ${imageType}: ${error.message}`);
    return false;
  }
}

// Função para processar um arquivo de imagem
async function processImageFile(filename, filePath) {
  try {
    console.log(`\n🖼️  Processando: ${filename}`);

    // Extrair nome do jogo
    const gameName = extractGameNameFromFilename(filename);
    if (!gameName) {
      console.log(`   ⚠️  Nome do jogo não identificado para: ${filename}`);
      return null;
    }

    console.log(`   🎮 Jogo identificado: ${gameName}`);

    // Buscar jogo no Strapi
    const game = await findGameByName(gameName);
    if (!game) {
      console.log(`   ❌ Jogo não encontrado no Strapi: ${gameName}`);
      return null;
    }

    console.log(`   ✅ Jogo encontrado: ${game.name} (ID: ${game.id})`);

    // Determinar tipo de imagem
    const imageType = getImageType(filename);
    console.log(`   📋 Tipo: ${imageType}`);

    // Fazer upload da imagem para o Strapi
    console.log(`   📤 Fazendo upload para Strapi...`);

    const FormData = require('form-data');
    const formData = new FormData();
    formData.append('files', fs.createReadStream(filePath));

    const uploadResponse = await axios.post(`${STRAPI_URL}/api/upload`, formData, {
      headers: {
        ...formData.getHeaders(),
        'Content-Type': 'multipart/form-data',
      },
    });

    if (!uploadResponse.data || uploadResponse.data.length === 0) {
      console.log(`   ❌ Falha no upload`);
      return null;
    }

    const uploadedFile = uploadResponse.data[0];
    console.log(`   ✅ Upload concluído: ${uploadedFile.name} (ID: ${uploadedFile.id})`);

    // Associar imagem ao jogo
    const associationResult = await associateImageToGame(game.id, uploadedFile.id, imageType);

    // Limpar arquivo original após upload bem-sucedido
    if (associationResult) {
      fs.unlinkSync(filePath);
      console.log(`   🗑️  Arquivo original removido: ${filename}`);
    }

    return {
      filename,
      gameName,
      gameId: game.id,
      imageId: uploadedFile.id,
      imageType,
      success: associationResult,
    };
  } catch (error) {
    console.log(`   ❌ Erro ao processar ${filename}: ${error.message}`);
    return null;
  }
}

// Função para escanear pasta de uploads
function scanUploadsDirectory() {
  const files = [];

  if (!fs.existsSync(UPLOADS_DIR)) {
    console.log(`❌ Pasta de uploads não encontrada: ${UPLOADS_DIR}`);
    return files;
  }

  const items = fs.readdirSync(UPLOADS_DIR);

  for (const item of items) {
    const itemPath = path.join(UPLOADS_DIR, item);
    const stat = fs.statSync(itemPath);

    if (stat.isFile()) {
      // Filtrar apenas arquivos de imagem
      if (/\.(jpg|jpeg|png|gif|webp)$/i.test(item)) {
        files.push({
          name: item,
          path: itemPath,
          size: stat.size,
        });
      }
    }
  }

  return files;
}

// Função principal para associar todas as imagens
async function associateAllImages() {
  try {
    console.log('🚀 Iniciando associação automática de imagens...\n');

    // Escanear pasta de uploads
    const imageFiles = scanUploadsDirectory();
    console.log(`📁 Encontrados ${imageFiles.length} arquivos de imagem`);

    if (imageFiles.length === 0) {
      console.log('❌ Nenhuma imagem encontrada para processar');
      return;
    }

    // Agrupar arquivos por jogo
    const filesByGame = {};
    for (const file of imageFiles) {
      const gameName = extractGameNameFromFilename(file.name);
      if (gameName) {
        if (!filesByGame[gameName]) {
          filesByGame[gameName] = [];
        }
        filesByGame[gameName].push(file);
      }
    }

    console.log(`\n🎮 Jogos identificados: ${Object.keys(filesByGame).length}`);

    const results = [];
    let processedCount = 0;
    let successCount = 0;

    // Processar cada jogo
    for (const [gameName, files] of Object.entries(filesByGame)) {
      console.log(`\n🎮 ${gameName} (${files.length} arquivos)`);

      for (const file of files) {
        processedCount++;
        const result = await processImageFile(file.name, file.path);

        if (result) {
          results.push(result);
          if (result.success) successCount++;
        }

        // Pausa entre processamentos
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    // Relatório final
    console.log('\n🏁 ASSOCIAÇÃO CONCLUÍDA!');
    console.log(`📊 RESUMO:`);
    console.log(`   🖼️  Total de arquivos processados: ${processedCount}`);
    console.log(`   ✅ Associações bem-sucedidas: ${successCount}`);
    console.log(`   ❌ Falhas: ${processedCount - successCount}`);
    console.log(`   🎮 Jogos processados: ${Object.keys(filesByGame).length}`);

    // Salvar resultados
    const outputPath = path.join(__dirname, 'image-association-results.json');
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
    console.log(`\n💾 Resultados salvos em: ${outputPath}`);

    return results;
  } catch (error) {
    console.error('❌ Erro ao associar imagens:', error.message);
    return null;
  }
}

// Função principal
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('🚀 Associador Automático de Imagens do Strapi');
    console.log('\n📋 USO:');
    console.log('   node scripts/associate-uploaded-images.js [opções]');
    console.log('\n🔧 OPÇÕES:');
    console.log('   --all              Associar todas as imagens da pasta @uploads/');
    console.log('   --scan             Apenas escanear e mostrar estatísticas');
    console.log('   --test             Testar com um arquivo específico');
    console.log('\n💡 EXEMPLOS:');
    console.log('   node scripts/associate-uploaded-images.js --all');
    console.log('   node scripts/associate-uploaded-images.js --scan');
    return;
  }

  if (args[0] === '--all') {
    await associateAllImages();
  } else if (args[0] === '--scan') {
    console.log('🔍 Escaneando pasta de uploads...\n');
    const imageFiles = scanUploadsDirectory();
    console.log(`📁 Total de arquivos de imagem: ${imageFiles.length}`);

    const filesByGame = {};
    for (const file of imageFiles) {
      const gameName = extractGameNameFromFilename(file.name);
      if (gameName) {
        if (!filesByGame[gameName]) {
          filesByGame[gameName] = [];
        }
        filesByGame[gameName].push(file);
      }
    }

    console.log(`\n🎮 Jogos identificados:`);
    for (const [gameName, files] of Object.entries(filesByGame)) {
      console.log(`   ${gameName}: ${files.length} arquivos`);
    }
  } else if (args[0] === '--test') {
    console.log('🧪 Testando associação...');
    const testFile = 'stardew_valley_cover.jpg';
    const testPath = path.join(UPLOADS_DIR, testFile);

    if (fs.existsSync(testPath)) {
      const result = await processImageFile(testFile, testPath);
      console.log('\n📊 RESULTADO DO TESTE:');
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log('❌ Arquivo de teste não encontrado');
    }
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  associateAllImages,
  scanUploadsDirectory,
  extractGameNameFromFilename,
  processImageFile,
};
