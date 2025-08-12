# 💡 Exemplos Práticos - RootGames API

Este documento contém exemplos práticos de uso da API, scripts úteis e casos de uso reais para o projeto RootGames.

---

## 🚀 **Exemplos de Uso da API**

### **1. Buscar Jogos com Filtros Avançados**

```bash
# Buscar jogos de RPG com preço menor que $50
curl "http://localhost:1337/api/games?\
filters[categories][name][$eq]=RPG&\
filters[price][$lt]=50&\
populate=*&\
sort=price:asc"

# Buscar jogos lançados em 2024 para PC
curl "http://localhost:1337/api/games?\
filters[release_date][$gte]=2024-01-01&\
filters[release_date][$lte]=2024-12-31&\
filters[platforms][name][$eq]=PC&\
populate=*&\
sort=release_date:desc"
```

### **2. Criar Jogo Completo via API**

```bash
curl -X POST "http://localhost:1337/api/games" \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "name": "Cyberpunk 2077",
      "slug": "cyberpunk-2077",
      "short_description": "Um RPG de ação e aventura em mundo aberto",
      "description": "<p>Cyberpunk 2077 é um RPG de ação e aventura em mundo aberto...</p>",
      "price": 59.99,
      "release_date": "2020-12-10",
      "rating": "BR18",
      "categories": [1, 2],
      "platforms": [1, 3, 4],
      "developers": [1],
      "publisher": 1
    }
  }'
```

### **3. Atualizar Preço de Jogos**

```bash
# Atualizar preço de um jogo específico
curl -X PUT "http://localhost:1337/api/games/1" \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "price": 39.99
    }
  }'
```

---

## 📊 **Scripts Úteis**

### **1. Script de Populate Automático**

```bash
#!/bin/bash
# populate_games.sh

# Configurações
API_URL="http://localhost:1337"
API_TOKEN="your-api-token-here"
LIMIT=100

echo "🚀 Iniciando população de jogos..."

# Popular jogos
response=$(curl -s -X POST "$API_URL/api/games/populate" \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"limit\": $LIMIT}")

if [[ $response == *"Finished populating games"* ]]; then
  echo "✅ População concluída com sucesso!"
  
  # Contar jogos criados
  games_count=$(curl -s "$API_URL/api/games?pagination[pageSize]=1" | \
    jq -r '.meta.pagination.total')
  
  echo "📊 Total de jogos no catálogo: $games_count"
else
  echo "❌ Erro na população: $response"
fi
```

### **2. Script de Backup Automático**

```bash
#!/bin/bash
# backup_database.sh

# Configurações
DB_HOST="127.0.0.1"
DB_PORT="5432"
DB_NAME="rootgames"
DB_USER="rootgames"
DB_PASS="rootgames"
BACKUP_DIR="/backups"
RETENTION_DAYS=7

# Criar diretório de backup se não existir
mkdir -p $BACKUP_DIR

# Nome do arquivo de backup
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/rootgames_backup_$DATE.sql"

echo "💾 Iniciando backup do banco de dados..."

# Fazer backup
PGPASSWORD=$DB_PASS pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER $DB_NAME > $BACKUP_FILE

if [ $? -eq 0 ]; then
  echo "✅ Backup criado: $BACKUP_FILE"
  
  # Comprimir backup
  gzip $BACKUP_FILE
  echo "📦 Backup comprimido: $BACKUP_FILE.gz"
  
  # Remover backups antigos
  find $BACKUP_DIR -name "*.sql.gz" -mtime +$RETENTION_DAYS -delete
  echo "🗑️ Backups antigos removidos"
else
  echo "❌ Erro ao criar backup"
  exit 1
fi
```

### **3. Script de Monitoramento**

```bash
#!/bin/bash
# monitor_api.sh

# Configurações
API_URL="http://localhost:1337"
LOG_FILE="/var/log/rootgames_api.log"
ALERT_EMAIL="admin@rootgames.com"

echo "🔍 Verificando status da API..."

# Testar health check
health_response=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/_health")

if [ $health_response -eq 200 ]; then
  echo "$(date): ✅ API está funcionando normalmente" >> $LOG_FILE
else
  echo "$(date): ❌ API com problemas - Status: $health_response" >> $LOG_FILE
  
  # Enviar alerta por email
  echo "API RootGames com problemas - Status: $health_response" | \
    mail -s "Alerta API RootGames" $ALERT_EMAIL
fi

# Verificar uso de memória
memory_usage=$(ps aux | grep strapi | grep -v grep | awk '{print $4}' | head -1)
echo "$(date): 💾 Uso de memória: ${memory_usage}%" >> $LOG_FILE
```

---

## 🎯 **Casos de Uso Reais**

### **1. E-commerce de Jogos**

```javascript
// Frontend - React/Next.js
const GameStore = () => {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Buscar jogos com filtros
    fetch('/api/games?populate=*&sort=price:asc&filters[price][$lt]=50')
      .then(res => res.json())
      .then(data => {
        setGames(data.data);
        setLoading(false);
      });
  }, []);

  return (
    <div>
      {games.map(game => (
        <GameCard key={game.id} game={game} />
      ))}
    </div>
  );
};
```

### **2. Sistema de Recomendações**

```javascript
// Backend - Node.js
const getRecommendedGames = async (userId) => {
  // Buscar histórico do usuário
  const userHistory = await getUserHistory(userId);
  
  // Buscar jogos similares
  const recommendations = await fetch(
    `${API_URL}/api/games?` +
    `filters[categories][id][$in]=${userHistory.categories.join(',')}&` +
    `populate=*&sort=rating:desc&pagination[pageSize]=10`
  ).then(res => res.json());
  
  return recommendations.data;
};
```

### **3. Integração com Discord Bot**

```javascript
// Discord Bot
const { Client, GatewayIntentBits } = require('discord.js');
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.on('interactionCreate', async interaction => {
  if (interaction.commandName === 'game') {
    const gameName = interaction.options.getString('name');
    
    // Buscar jogo na API
    const response = await fetch(
      `${API_URL}/api/games?filters[name][$containsi]=${gameName}&populate=*`
    );
    const data = await response.json();
    
    if (data.data.length > 0) {
      const game = data.data[0];
      await interaction.reply({
        embeds: [{
          title: game.attributes.name,
          description: game.attributes.short_description,
          fields: [
            { name: 'Preço', value: `$${game.attributes.price}`, inline: true },
            { name: 'Categorias', value: game.attributes.categories.data.map(c => c.attributes.name).join(', '), inline: true }
          ],
          image: { url: `${API_URL}${game.attributes.cover.data.attributes.url}` }
        }]
      });
    }
  }
});
```

---

## 🔧 **Configurações Avançadas**

### **1. Configuração de Cache Redis**

```javascript
// config/database.js
module.exports = ({ env }) => ({
  connection: {
    client: 'postgres',
    connection: {
      // ... configurações existentes
    },
  },
  settings: {
    cache: {
      enabled: true,
      type: 'redis',
      max: 32767,
      ttl: 3600000,
    },
  },
});
```

### **2. Webhook para Notificações**

```javascript
// config/webhooks.js
module.exports = {
  'game.created': {
    url: 'https://your-webhook-url.com/game-created',
    headers: {
      'Authorization': 'Bearer webhook-token',
    },
  },
  'game.updated': {
    url: 'https://your-webhook-url.com/game-updated',
    headers: {
      'Authorization': 'Bearer webhook-token',
    },
  },
};
```

### **3. Rate Limiting**

```javascript
// config/middlewares.js
module.exports = [
  'strapi::errors',
  {
    name: 'strapi::security',
    config: {
      rateLimit: {
        enabled: true,
        interval: 15 * 60 * 1000, // 15 minutos
        max: 100, // máximo 100 requests por intervalo
      },
    },
  },
  // ... outros middlewares
];
```

---

## 📱 **Exemplos Mobile**

### **1. React Native**

```javascript
// App.js
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Image } from 'react-native';

const GamesList = () => {
  const [games, setGames] = useState([]);

  useEffect(() => {
    fetch('http://localhost:1337/api/games?populate=*&sort=name:asc')
      .then(response => response.json())
      .then(data => setGames(data.data));
  }, []);

  const renderGame = ({ item }) => (
    <View style={styles.gameCard}>
      <Image 
        source={{ uri: `http://localhost:1337${item.attributes.cover.data.attributes.url}` }}
        style={styles.gameImage}
      />
      <Text style={styles.gameTitle}>{item.attributes.name}</Text>
      <Text style={styles.gamePrice}>${item.attributes.price}</Text>
    </View>
  );

  return (
    <FlatList
      data={games}
      renderItem={renderGame}
      keyExtractor={item => item.id.toString()}
    />
  );
};
```

### **2. Flutter**

```dart
// games_service.dart
class GamesService {
  static const String baseUrl = 'http://localhost:1337/api';

  Future<List<Game>> getGames() async {
    final response = await http.get(
      Uri.parse('$baseUrl/games?populate=*&sort=name:asc'),
    );

    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      return (data['data'] as List)
          .map((game) => Game.fromJson(game))
          .toList();
    } else {
      throw Exception('Falha ao carregar jogos');
    }
  }
}
```

---

## 🔍 **Debugging e Logs**

### **1. Logs Detalhados**

```javascript
// config/logger.js
module.exports = {
  settings: {
    logger: {
      level: 'debug',
      requests: true,
    },
  },
};
```

### **2. Monitoramento de Performance**

```javascript
// middleware/performance.js
module.exports = (config, { strapi }) => {
  return async (ctx, next) => {
    const start = Date.now();
    await next();
    const duration = Date.now() - start;
    
    strapi.log.info(`Request to ${ctx.url} took ${duration}ms`);
    
    if (duration > 1000) {
      strapi.log.warn(`Slow request detected: ${ctx.url} (${duration}ms)`);
    }
  };
};
```

---

## 🎮 **Exemplos de Integração**

### **1. Integração com Steam**

```javascript
// services/steam-integration.js
const steamApi = require('steam-api');

class SteamIntegration {
  async syncGames() {
    const steamGames = await steamApi.getTopGames();
    
    for (const steamGame of steamGames) {
      // Verificar se já existe na nossa API
      const existingGame = await strapi.entityService.findMany('api::game.game', {
        filters: { name: steamGame.name }
      });
      
      if (!existingGame.length) {
        // Criar novo jogo
        await strapi.entityService.create('api::game.game', {
          data: {
            name: steamGame.name,
            price: steamGame.price,
            // ... outros campos
          }
        });
      }
    }
  }
}
```

### **2. Integração com Twitch**

```javascript
// services/twitch-integration.js
const twitchApi = require('twitch-api');

class TwitchIntegration {
  async getGameStreams(gameName) {
    const game = await strapi.entityService.findMany('api::game.game', {
      filters: { name: gameName }
    });
    
    if (game.length > 0) {
      const streams = await twitchApi.getStreamsByGame(game[0].name);
      return streams;
    }
    
    return [];
  }
}
```

---

*Última atualização: Agosto 2025*
*Versão dos Exemplos: 1.0.0*
