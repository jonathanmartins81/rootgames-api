# 🎮 RootGames API

[![Strapi](https://img.shields.io/badge/Strapi-5.21.0-2F2E8B?style=for-the-badge&logo=strapi)](https://strapi.io/)
[![Node.js](https://img.shields.io/badge/Node.js-20.19.4-339933?style=for-the-badge&logo=node.js)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16.9-336791?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3.1-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![Build Status](https://img.shields.io/badge/Build-Passing-brightgreen?style=for-the-badge)](https://github.com/jonathanmartins81/rootgames-api)
[![TypeScript](https://img.shields.io/badge/TypeScript-Errors-0-brightgreen?style=for-the-badge)](https://github.com/jonathanmartins81/rootgames-api)

> **🎯 API Headless para Catálogo de Jogos** - Uma solução completa construída com Strapi 5.x CMS para gerenciamento de jogos, categorias, plataformas, desenvolvedores e publicadores.

## 🌟 Características

- 🚀 **API RESTful e GraphQL** completa
- 🎯 **Importação automática** de jogos da GOG
- 🖼️ **Sistema de mídia** avançado com upload automático
- 🔐 **Autenticação robusta** com JWT e tokens de API
- 📱 **Painel administrativo** customizado
- 🌍 **Suporte a internacionalização** (i18n)
- ✨ **Editor rico CKEditor** para descrições
- 📊 **Relacionamentos complexos** entre entidades
- 🔄 **Webhooks** para integrações
- 📈 **Escalável** e pronto para produção
- 🛡️ **TypeScript** com configurações otimizadas
- 🧪 **Testes** configurados com Jest
- 🎨 **ESLint + Prettier** para qualidade de código
- 🔧 **Build otimizado** (20.94s)
- ✅ **Zero erros TypeScript**
- 🚀 **Sistema de Qualidade** completo (ESLint, Prettier, Commitlint, Husky)
- 🖼️ **Otimização de Imagens** automática (Sharp + Imagemin)

## 🏗️ Arquitetura

```
rootgames-api/
├── 📁 config/                 # Configurações do Strapi
├── 📁 src/
│   ├── 📁 api/               # APIs e entidades
│   │   ├── 🎮 game/         # Entidade de jogos
│   │   ├── 🏷️ category/     # Entidade de categorias
│   │   ├── 🎯 platform/     # Entidade de plataformas
│   │   ├── 👨‍💻 developer/    # Entidade de desenvolvedores
│   │   └── 📢 publisher/    # Entidade de publicadores
│   ├── 📁 admin/            # Customizações do painel admin
│   └── 📁 extensions/       # Extensões personalizadas
├── 📁 database/             # Migrações e dados
├── 📁 docs/                 # 📚 Documentação completa
├── 📁 public/               # Arquivos públicos
├── 📁 scripts/              # Scripts de automação
└── 📁 patches/              # Patches personalizados
```

## 📊 Modelo de Dados

### **Entidades Principais**

| Entidade          | Descrição                   | Campos Principais                             |
| ----------------- | --------------------------- | --------------------------------------------- |
| **🎮 Games**      | Jogos do catálogo           | Nome, preço, descrição, rating, capa, galeria |
| **🏷️ Categories** | Categorias/gêneros          | Nome, slug                                    |
| **🎯 Platforms**  | Plataformas (PC, PS5, Xbox) | Nome, slug                                    |
| **👨‍💻 Developers** | Estúdios de desenvolvimento | Nome, slug                                    |
| **📢 Publishers** | Empresas publicadoras       | Nome, slug                                    |

### **Relacionamentos**

- **Games ↔ Categories**: Many-to-Many
- **Games ↔ Platforms**: Many-to-Many
- **Games ↔ Developers**: Many-to-Many
- **Games ↔ Publisher**: Many-to-One

## 🚀 Início Rápido

### **Pré-requisitos**

- **Node.js**: 20.x - 24.x (recomendado: 20.x LTS)
- **Yarn**: 1.22+ (gerenciador de pacotes)
- **PostgreSQL**: 12+ (recomendado: 16+)
- **Git**: Controle de versão

### **Instalação**

```bash
# 1. Clone o repositório
git clone https://github.com/jonathanmartins81/rootgames-api.git
cd rootgames-api

# 2. Instale as dependências
yarn install

# 3. Configure o banco de dados PostgreSQL
# (veja docs/STRAPI_CONFIGURATION.md para detalhes)

# 4. Crie o arquivo .env
cp .env.example .env
# Edite o arquivo .env com suas configurações

# 5. Inicie o servidor
yarn develop
```

### **Configuração do Banco**

```bash
# Acesse PostgreSQL como superusuário
sudo -u postgres psql

# Crie usuário e banco de dados
CREATE USER rootgames WITH PASSWORD 'rootgames123';
CREATE DATABASE rootgames OWNER rootgames;
GRANT ALL PRIVILEGES ON DATABASE rootgames TO rootgames;

# Saia do PostgreSQL
\q
```

### **Arquivo de Ambiente (.env)**

```env
# Database Configuration
DATABASE_CLIENT=postgres
DATABASE_HOST=127.0.0.1
DATABASE_PORT=5432
DATABASE_NAME=rootgames
DATABASE_USERNAME=rootgames
DATABASE_PASSWORD=rootgames123
DATABASE_SSL=false

# App Configuration
HOST=0.0.0.0
PORT=1337

# Security Keys (GENERATE NEW ONES FOR PRODUCTION!)
APP_KEYS=key1,key2,key3,key4
API_TOKEN_SALT=salt123
ADMIN_JWT_SECRET=admin-secret
JWT_SECRET=jwt-secret
TRANSFER_TOKEN_SALT=transfer-salt
```

## 🌐 Acessos

Após iniciar o servidor, acesse:

- **🖥️ Admin Panel**: [http://localhost:1337/admin](http://localhost:1337/admin)
- **🔌 API REST**: [http://localhost:1337/api](http://localhost:1337/api)
- **📡 GraphQL**: [http://localhost:1337/graphql](http://localhost:1337/graphql)

## 📚 Documentação

### **📖 Documentação Completa**

A documentação completa está disponível na pasta [`docs/`](./docs/):

- **[📋 Índice](./docs/INDEX.md)** - Navegação e índice completo
- **[🚀 Configuração](./docs/STRAPI_CONFIGURATION.md)** - Setup e configuração
- **[🔌 API](./docs/API_DOCUMENTATION.md)** - Endpoints e funcionalidades
- **[💡 Exemplos](./docs/EXAMPLES.md)** - Casos de uso e scripts
- **[📖 Visão Geral](./docs/README.md)** - Introdução ao projeto

### **🎯 Início Rápido por Tipo de Usuário**

#### **Para Desenvolvedores Novos**

1. [📖 Visão Geral](./docs/README.md) - Entenda o projeto
2. [🚀 Configuração](./docs/STRAPI_CONFIGURATION.md) - Configure o ambiente
3. [🔌 API](./docs/API_DOCUMENTATION.md) - Aprenda a usar a API

#### **Para Desenvolvedores Experientes**

1. [🔌 API](./docs/API_DOCUMENTATION.md) - Referência rápida
2. [💡 Exemplos](./docs/EXAMPLES.md) - Exemplos avançados
3. [🗺️ Roadmap 2025](./ROADMAP_2025.md) - Próximos passos

## 🔌 API Endpoints

### **🎮 Jogos**

```bash
# Listar jogos
GET /api/games?populate=*&sort=name:asc

# Buscar jogo por ID
GET /api/games/1?populate=*

# Criar jogo
POST /api/games
Authorization: Bearer YOUR_API_TOKEN

# Atualizar jogo
PUT /api/games/1

# Deletar jogo
DELETE /api/games/1
```

### **🏷️ Categorias**

```bash
# Listar categorias
GET /api/categories?populate=games

# Criar categoria
POST /api/categories
```

### **🔄 Populate Automático**

```bash
# Importar jogos da GOG
POST /api/games/populate
Authorization: Bearer YOUR_API_TOKEN

# Com parâmetros
{
  "limit": 100,
  "order": "desc:trending"
}
```

### **🔍 Filtros Avançados**

```bash
# Jogos de RPG com preço < $50
GET /api/games?filters[categories][name][$eq]=RPG&filters[price][$lt]=50

# Jogos lançados em 2024 para PC
GET /api/games?filters[release_date][$gte]=2024-01-01&filters[platforms][name][$eq]=PC
```

## 🛠️ Comandos Úteis

### **Desenvolvimento**

```bash
yarn develop          # Iniciar servidor de desenvolvimento
yarn build           # Construir para produção
yarn start           # Iniciar servidor de produção
yarn dev             # Alias para develop
yarn prod            # Alias para start
```

### **Banco de Dados**

```bash
yarn db:backup       # Backup do banco
yarn db:restore      # Restaurar backup
yarn db:seed         # Popular com dados de teste
yarn db:migrate      # Executar migrações
```

### **Administração**

```bash
yarn admin:create    # Criar usuário admin
yarn admin:list      # Listar usuários admin
yarn info            # Informações do sistema
yarn version         # Versão do Strapi
```

### **Qualidade de Código**

```bash
yarn quality         # Executar todas as verificações de qualidade
yarn quality:fix     # Corrigir problemas automaticamente
yarn lint            # Verificar código com ESLint
yarn lint:fix        # Corrigir problemas ESLint
yarn format          # Formatar código com Prettier
yarn format:check    # Verificar formatação
yarn type-check      # Verificar tipos TypeScript
```

### **Testes**

```bash
yarn test            # Executar testes
yarn test:watch      # Testes em modo watch
yarn test:coverage   # Testes com cobertura
yarn test:e2e        # Testes end-to-end
```

### **Manutenção**

```bash
yarn clean           # Limpar arquivos temporários
yarn clean:all       # Limpeza completa
yarn backup          # Backup do projeto
yarn deploy          # Deploy seguro
yarn health          # Verificar saúde do sistema
yarn monitor         # Monitorar sistema
```

### **Otimização de Imagens**

```bash
yarn images:optimize # Otimizar todas as imagens em public/uploads
yarn images:thumbnails # Gerar thumbnails de diferentes tamanhos
yarn images:webp     # Converter imagens para WebP
```

## 🖼️ Sistema de Otimização de Imagens

### **🛠️ Ferramentas Implementadas**

- **Sharp**: Processamento e redimensionamento de imagens
- **Imagemin**: Compressão adicional e otimização
- **WebP/AVIF**: Conversão para formatos modernos
- **Thumbnails**: Geração automática de múltiplos tamanhos

### **📋 Funcionalidades**

#### **Otimização Automática**

- Compressão inteligente mantendo qualidade
- Redimensionamento automático
- Conversão para WebP e AVIF
- Geração de thumbnails

#### **Presets Configurados**

- **Thumbnail**: 150x150px (85% qualidade)
- **Game Card**: 300x200px (90% qualidade)
- **Hero**: 1200x600px (85% qualidade)
- **Gallery**: 800x600px (90% qualidade)
- **Avatar**: 100x100px (90% qualidade)

#### **Formatos Suportados**

- JPEG/PNG → WebP/AVIF
- Compressão inteligente
- Múltiplas versões por imagem
- Otimização automática no upload

### **🔧 Uso Programático**

```typescript
import ImageOptimizer, { ImagePresets } from './src/utils/imageOptimizer';

// Otimizar uma imagem
const result = await ImageOptimizer.optimizeWithSharp('input.jpg', 'output.jpg', ImagePresets.gameCard);

// Gerar múltiplos formatos
const formats = await ImageOptimizer.createMultipleFormats('input.jpg', './output/', ImagePresets.webp);

// Gerar thumbnails
const thumbnails = await ImageOptimizer.generateThumbnails('input.jpg', './thumbnails/', [
  { width: 150, height: 150, suffix: '_thumb' },
  { width: 300, height: 200, suffix: '_card' },
]);
```

### **🌐 API Endpoints**

```bash
# Otimizar imagens existentes
POST /api/games/optimize-images
```

## 🚀 Sistema de Qualidade de Código

### **🛠️ Ferramentas Implementadas**

- **ESLint**: Linting de código JavaScript/TypeScript
- **Prettier**: Formatação automática de código
- **Commitlint**: Validação de mensagens de commit
- **Husky**: Git hooks para automação
- **Lint-staged**: Linting apenas em arquivos modificados

### **📋 Padrões de Commit**

O projeto segue o padrão **Conventional Commits**:

```bash
# Formatos válidos:
feat: add new user authentication system
fix: resolve database connection issue
docs: update API documentation
style: format code according to standards
refactor: improve game service performance
test: add unit tests for user service
chore: update dependencies
```

### **🔧 Hooks Automáticos**

- **Pre-commit**: Executa linting e formatação automaticamente
- **Commit-msg**: Valida formato da mensagem de commit
- **Lint-staged**: Processa apenas arquivos modificados

### **⚙️ Configurações**

- **`.prettierrc.json`**: Regras de formatação
- **`eslint.config.js`**: Regras de linting
- **`commitlint.config.js`**: Regras de commit
- **`.lintstagedrc.js`**: Configuração de lint-staged

## 🔧 Configurações Avançadas

### **Cache Redis**

```javascript
// config/database.js
module.exports = ({ env }) => ({ settings: { cache: { enabled: true, type: 'redis', max: 32767, ttl: 3600000 } } });
```

### **Rate Limiting**

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

## 🚀 Funcionalidades Implementadas

### **✅ Concluído**

- [x] API REST completa com CRUD
- [x] API GraphQL funcional
- [x] Sistema de upload de mídia
- [x] Importação automática da GOG
- [x] Painel administrativo customizado
- [x] Sistema de permissões
- [x] Editor rico CKEditor
- [x] Relacionamentos entre entidades
- [x] Documentação completa
- [x] TypeScript configurado
- [x] ESLint + Prettier
- [x] Scripts de automação
- [x] Configurações otimizadas
- [x] Build funcional (20.94s)
- [x] Zero erros TypeScript
- [x] Database connection otimizada

### **🔄 Em Desenvolvimento**

- [ ] Sistema de usuários avançado
- [ ] Reviews e avaliações
- [ ] Wishlist e favoritos
- [ ] Sistema de notificações

### **📋 Planejado (2025)**

- [ ] Integração multi-loja (Steam, Epic, etc.)
- [ ] Sistema de preços dinâmicos
- [ ] Analytics e relatórios
- [ ] Mobile app nativo
- [ ] IA/ML para recomendações

## 🐛 Troubleshooting

### **Problemas Comuns**

#### **Erro de Conexão PostgreSQL**

```bash
# Verificar se o serviço está rodando
sudo systemctl status postgresql

# Testar conexão
PGPASSWORD=rootgames123 psql -h 127.0.0.1 -U rootgames -d rootgames
```

#### **Erro de Compilação TypeScript**

```bash
# Limpar cache
yarn clean
yarn develop
```

#### **Erro de Memória**

```bash
# Aumentar memória do Node.js
export NODE_OPTIONS="--max-old-space-size=4096"
yarn develop
```

### **Logs Úteis**

```bash
# Logs do Strapi
tail -f .tmp/logs/strapi.log

# Logs do PostgreSQL
sudo journalctl -u postgresql -f
```

## 🔐 Segurança

### **Configurações de Produção**

```env
# Sempre use HTTPS
NODE_ENV=production
DATABASE_SSL=true
CORS_ORIGIN=https://yourdomain.com

# Chaves seguras (geradas aleatoriamente)
APP_KEYS=chave1-segura,chave2-segura,chave3-segura,chave4-segura
API_TOKEN_SALT=salt-seguro-aleatorio
ADMIN_JWT_SECRET=jwt-secret-seguro
JWT_SECRET=jwt-secret-seguro
TRANSFER_TOKEN_SALT=transfer-salt-seguro
```

### **Firewall e Rede**

```bash
# Configurar firewall
sudo ufw allow 1337/tcp
sudo ufw allow 5432/tcp

# Restringir acesso ao PostgreSQL
sudo nano /var/lib/pgsql/data/pg_hba.conf
```

## 📈 Roadmap 2025

Consulte o [🗺️ ROADMAP_2025.md](./ROADMAP_2025.md) para detalhes completos sobre:

- **Q1 2025**: Fundação e estabilização ✅ **CONCLUÍDO**
- **Q2 2025**: Expansão de funcionalidades 🔄 **EM ANDAMENTO**
- **Q3 2025**: Integração e automação 📋 **PLANEJADO**
- **Q4 2025**: Escalabilidade e inovação 📋 **PLANEJADO**

## 🤝 Contribuindo

### **Como Contribuir**

1. **Fork** o repositório
2. **Crie** uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. **Commit** suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. **Push** para a branch (`git push origin feature/AmazingFeature`)
5. **Abra** um Pull Request

### **Padrões de Código**

- Use **TypeScript** para todo o código
- Siga as **convenções do Strapi**
- **Documente** novas funcionalidades
- Mantenha **testes atualizados**
- Use **conventional commits**
- Execute `yarn lint` e `yarn format` antes de commitar

### **Reportando Bugs**

- Use o sistema de **Issues** do GitHub
- Inclua **passos para reproduzir**
- Adicione **logs de erro**
- Especifique **versão e ambiente**

## 📄 Licença

Este projeto está licenciado sob a **MIT License** - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 🙏 Agradecimentos

- **[Strapi Team](https://strapi.io/)** - Pelo excelente CMS headless
- **[GOG.com](https://www.gog.com/)** - Pela API de jogos
- **[Comunidade Open Source](https://opensource.org/)** - Pelas contribuições
- **Todos os contribuidores** que ajudaram neste projeto

## 📞 Suporte

### **Recursos**

- **📚 Documentação**: [docs/](./docs/)
- **🐛 Issues**: [GitHub Issues](https://github.com/jonathanmartins81/rootgames-api/issues)
- **💬 Discussões**: [GitHub Discussions](https://github.com/jonathanmartins81/rootgames-api/discussions)

### **Comunidade Strapi**

- **🌐 Fórum**: [forum.strapi.io](https://forum.strapi.io/)
- **💬 Discord**: [discord.strapi.io](https://discord.strapi.io/)
- **📖 Documentação**: [docs.strapi.io](https://docs.strapi.io/)

---

## ⭐ Se este projeto te ajudou, considere dar uma estrela!

**RootGames API** - Transformando a gestão de catálogos de jogos com tecnologia moderna e código aberto! 🎮✨

---

_Última atualização: Agosto 2025_
_Versão: 1.0.0_
_Status: Q1 2025 Concluído, Q2 2025 em Andamento_
_Mantido com ❤️ pela comunidade_
