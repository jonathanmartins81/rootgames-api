# 📋 DOCUMENTAÇÃO DOS ARQUIVOS DE CONFIGURAÇÃO

## 🎯 **ARQUIVOS QUE NÃO ACEITAM COMENTÁRIOS**

### **1. package.json - Configuração do Projeto**

**Localização:** `package.json`

**Propósito:** Arquivo principal de configuração do projeto Node.js/Strapi

**Estrutura Detalhada:**

```json
{
  "name": "rootgames-api",
  "private": true,
  "version": "0.1.0",
  "description": "API de catálogo de jogos com Strapi 5",
  "scripts": {
    "develop": "strapi develop",
    "start": "strapi start",
    "build": "strapi build",
    "strapi": "strapi"
  },
  "dependencies": {
    "@strapi/strapi": "^5.21.0",
    "@strapi/plugin-graphql": "^5.21.0",
    "@strapi/plugin-users-permissions": "^5.21.0",
    "Editor nativo": "textarea"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "vitest": "^3.2.4",
    "playwright": "^1.54.2",
    "eslint": "^8.0.0"
  },
  "author": "RootGames Team",
  "strapi": {
    "uuid": "unique-project-uuid"
  },
  "engines": {
    "node": ">=18.0.0 <=20.x.x",
    "npm": ">=6.0.0"
  },
  "license": "MIT"
}
```

**Explicação dos Campos:**

- **name**: Nome do projeto (usado pelo npm/yarn)
- **private**: true = projeto privado, não será publicado no npm
- **version**: Versão semântica do projeto
- **description**: Descrição do projeto
- **scripts**: Comandos disponíveis para execução
- **dependencies**: Pacotes necessários em produção
- **devDependencies**: Pacotes necessários apenas em desenvolvimento
- **author**: Autor do projeto
- **strapi.uuid**: UUID único do projeto Strapi
- **engines**: Versões suportadas do Node.js e npm
- **license**: Licença do projeto

### **2. tsconfig.json - Configuração TypeScript**

**Localização:** `tsconfig.json`

**Propósito:** Configuração do compilador TypeScript

**Estrutura Detalhada:**

```json
{
  "extends": "@strapi/typescript-utils/tsconfigs/server",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": ".",
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "incremental": true,
    "plugins": [
      {
        "name": "@strapi/typescript-utils/tsconfigs/server"
      }
    ]
  },
  "include": ["./", "./**/*.ts", "./**/*.js", "./**/*.json"],
  "exclude": [
    "node_modules/",
    "build/",
    "dist/",
    ".cache/",
    ".tmp/",
    "src/admin/",
    "**/*.test.ts",
    "**/*.test.js"
  ]
}
```

**Explicação das Configurações:**

- **extends**: Herda configuração base do Strapi
- **outDir**: Diretório de saída dos arquivos compilados
- **rootDir**: Diretório raiz do projeto
- **target**: Versão do JavaScript de saída (ES2022)
- **module**: Sistema de módulos (ESNext)
- **moduleResolution**: Estratégia de resolução de módulos
- **allowImportingTsExtensions**: Permite importar arquivos .ts
- **strict**: Modo estrito habilitado
- **noEmit**: Não gera arquivos de saída (usado pelo Strapi)
- **esModuleInterop**: Interoperabilidade com ES modules
- **skipLibCheck**: Pula verificação de tipos de bibliotecas
- **include**: Arquivos incluídos na compilação
- **exclude**: Arquivos excluídos da compilação

### **3. .prettierrc.json - Configuração Prettier**

**Localização:** `.prettierrc.json`

**Propósito:** Configuração de formatação de código

**Estrutura Detalhada:**

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 80,
  "bracketSpacing": true,
  "arrowParens": "avoid",
  "endOfLine": "lf",
  "quoteProps": "as-needed",
  "useTabs": false,
  "bracketSameLine": false,
  "proseWrap": "preserve"
}
```

**Explicação das Configurações:**

- **semi**: Adiciona ponto e vírgula no final das linhas
- **singleQuote**: Usa aspas simples em vez de duplas
- **tabWidth**: Largura da indentação (2 espaços)
- **trailingComma**: Adiciona vírgula no final de objetos/arrays
- **printWidth**: Largura máxima da linha (80 caracteres)
- **bracketSpacing**: Espaços entre colchetes
- **arrowParens**: Parênteses em arrow functions
- **endOfLine**: Tipo de quebra de linha (LF)
- **quoteProps**: Quando usar aspas em propriedades
- **useTabs**: Usar tabs em vez de espaços
- **bracketSameLine**: Colchetes na mesma linha
- **proseWrap**: Como quebrar texto em markdown

### **4. .editorconfig - Configuração do Editor**

**Localização:** `.editorconfig`

**Propósito:** Configuração consistente entre editores

**Estrutura Detalhada:**

```ini
root = true

[*]
charset = utf-8
end_of_line = lf
insert_final_newline = true
trim_trailing_whitespace = true
indent_style = space
indent_size = 2

[*.md]
trim_trailing_whitespace = false

[*.{js,jsx,ts,tsx,json}]
indent_style = space
indent_size = 2

[*.{yml,yaml}]
indent_style = space
indent_size = 2

[*.{sql}]
indent_style = space
indent_size = 4
```

**Explicação das Configurações:**

- **root = true**: Este é o arquivo raiz
- **charset**: Codificação de caracteres (UTF-8)
- **end_of_line**: Tipo de quebra de linha (LF)
- **insert_final_newline**: Adiciona linha final
- **trim_trailing_whitespace**: Remove espaços no final
- **indent_style**: Tipo de indentação (space/tab)
- **indent_size**: Tamanho da indentação
- **Seções específicas**: Configurações por tipo de arquivo

### **5. .gitignore - Arquivos Ignorados pelo Git**

**Localização:** `.gitignore`

**Propósito:** Define quais arquivos não devem ser versionados

**Principais Seções:**

```gitignore
# Dependencies
node_modules/
yarn-error.log

# Build outputs
build/
dist/
.cache/
.tmp/

# Environment variables
.env
.env.local
.env.*.local

# Logs
logs/
*.log

# Runtime data
pids/
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/
*.lcov

# nyc test coverage
.nyc_output

# Dependency directories
jspm_packages/

# Optional npm cache directory
.npm

# Optional eslint cache
.eslintcache

# Microbundle cache
.rpt2_cache/
.rts2_cache_cjs/
.rts2_cache_es/
.rts2_cache_umd/

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# dotenv environment variables file
.env.test

# parcel-bundler cache (https://parceljs.org/)
.parcel-cache

# Next.js build output
.next

# Nuxt.js build / generate output
.nuxt
dist

# Gatsby files
.cache/
public

# Storybook build outputs
.out
.storybook-out

# Temporary folders
tmp/
temp/

# Editor directories and files
.vscode/
.idea/
*.swp
*.swo
*~

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# Strapi specific
.strapi/
.strapi-updater.json
```

**Explicação das Seções:**

- **Dependencies**: Arquivos de dependências
- **Build outputs**: Arquivos gerados pelo build
- **Environment variables**: Variáveis de ambiente
- **Logs**: Arquivos de log
- **Runtime data**: Dados de execução
- **Coverage**: Relatórios de cobertura de testes
- **Cache**: Arquivos de cache
- **Editor**: Arquivos específicos de editores
- **OS**: Arquivos do sistema operacional
- **Strapi**: Arquivos específicos do Strapi

### **6. .lintstagedrc.js - Configuração Lint-Staged**

**Localização:** `.lintstagedrc.js`

**Propósito:** Configuração de linting em arquivos staged

**Estrutura Detalhada:**

```javascript
module.exports = {
  '*.{js,jsx,ts,tsx}': ['eslint --fix', 'prettier --write'],
  '*.{json,md,yml,yaml}': ['prettier --write'],
  '*.{css,scss,sass}': ['prettier --write'],
};
```

**Explicação:**

- **Arquivos JS/TS**: Executa ESLint e Prettier
- **Arquivos de configuração**: Executa apenas Prettier
- **Arquivos CSS**: Executa apenas Prettier

### **7. commitlint.config.js - Configuração Commitlint**

**Localização:** `commitlint.config.js`

**Propósito:** Validação de mensagens de commit

**Estrutura Detalhada:**

```javascript
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'style',
        'refactor',
        'perf',
        'test',
        'build',
        'ci',
        'chore',
        'revert',
      ],
    ],
    'type-case': [2, 'always', 'lower'],
    'type-empty': [2, 'never'],
    'subject-case': [2, 'always', 'lower'],
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],
    'header-max-length': [2, 'always', 72],
  },
};
```

**Explicação das Regras:**

- **type-enum**: Tipos de commit permitidos
- **type-case**: Case do tipo (lowercase)
- **type-empty**: Tipo não pode ser vazio
- **subject-case**: Case do assunto (lowercase)
- **subject-empty**: Assunto não pode ser vazio
- **subject-full-stop**: Sem ponto final no assunto
- **header-max-length**: Máximo 72 caracteres no header

### **8. yarn.lock - Lock de Dependências**

**Localização:** `yarn.lock`

**Propósito:** Lock das versões exatas das dependências

**Características:**

- **Gerado automaticamente** pelo Yarn
- **Não deve ser editado manualmente**
- **Garante versões consistentes** entre ambientes
- **Contém hashes** para verificação de integridade
- **Específico para Yarn** (npm usa package-lock.json)

### **9. .strapi-updater.json - Configuração do Strapi Updater**

**Localização:** `.strapi-updater.json`

**Propósito:** Configuração do sistema de atualização do Strapi

**Estrutura:**

```json
{
  "uuid": "unique-project-uuid",
  "version": "5.21.0",
  "lastUpdate": "2025-08-14T00:00:00.000Z"
}
```

**Explicação:**

- **uuid**: Identificador único do projeto
- **version**: Versão atual do Strapi
- **lastUpdate**: Data da última atualização

---

## 🔧 **ARQUIVOS DE CONFIGURAÇÃO DE TESTES**

### **1. vitest.config.ts - Configuração Vitest**

**Localização:** `vitest.config.ts`

**Propósito:** Configuração do framework de testes Vitest

**Estrutura Detalhada:**

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'build/',
        '.cache/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*',
      ],
    },
    include: ['tests/**/*.test.ts', 'tests/**/*.spec.ts'],
    exclude: ['node_modules/', 'dist/', 'build/'],
  },
});
```

**Explicação das Configurações:**

- **globals**: Habilita APIs globais do Vitest
- **environment**: Ambiente de execução (node)
- **setupFiles**: Arquivos de configuração dos testes
- **coverage**: Configuração de cobertura de código
- **include**: Arquivos incluídos nos testes
- **exclude**: Arquivos excluídos dos testes

### **2. playwright.config.ts - Configuração Playwright**

**Localização:** `playwright.config.ts`

**Propósito:** Configuração dos testes E2E com Playwright

**Estrutura Detalhada:**

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:1337',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: 'yarn develop',
    url: 'http://localhost:1337',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
```

**Explicação das Configurações:**

- **testDir**: Diretório dos testes E2E
- **fullyParallel**: Execução paralela completa
- **forbidOnly**: Proíbe .only() em CI
- **retries**: Número de tentativas em caso de falha
- **workers**: Número de workers paralelos
- **reporter**: Tipo de relatório
- **use**: Configurações globais dos testes
- **projects**: Configurações por navegador
- **webServer**: Configuração do servidor de teste

---

## 📁 **ARQUIVOS DE CONFIGURAÇÃO DE DEPLOYMENT**

### **1. Dockerfile - Configuração Docker**

**Localização:** `Dockerfile` (se existir)

**Propósito:** Configuração para containerização

**Estrutura Típica:**

```dockerfile
FROM node:20-alpine

WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./
COPY yarn.lock ./

# Instalar dependências
RUN yarn install --frozen-lockfile --production=false

# Copiar código fonte
COPY . .

# Build da aplicação
RUN yarn build

# Expor porta
EXPOSE 1337

# Comando de inicialização
CMD ["yarn", "start"]
```

**Explicação das Instruções:**

- **FROM**: Imagem base (Node.js 20 Alpine)
- **WORKDIR**: Diretório de trabalho
- **COPY**: Copia arquivos para o container
- **RUN**: Executa comandos durante o build
- **EXPOSE**: Expõe porta do container
- **CMD**: Comando de inicialização

### **2. .dockerignore - Arquivos Ignorados pelo Docker**

**Localização:** `.dockerignore`

**Propósito:** Arquivos não incluídos na imagem Docker

**Conteúdo Típico:**

```dockerignore
node_modules
npm-debug.log
.git
.gitignore
README.md
.env
.nyc_output
coverage
.cache
.tmp
dist
build
tests
docs
.vscode
.idea
*.log
```

---

## 🔒 **ARQUIVOS DE CONFIGURAÇÃO DE SEGURANÇA**

### **1. .env.example - Exemplo de Variáveis de Ambiente**

**Localização:** `.env.example`

**Propósito:** Template para variáveis de ambiente

**Estrutura:**

```bash
# Database Configuration
DATABASE_HOST=127.0.0.1
DATABASE_PORT=5432
DATABASE_NAME=rootgames
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=your_password_here

# Admin Configuration
ADMIN_JWT_SECRET=your_admin_jwt_secret_here
API_TOKEN_SALT=your_api_token_salt_here
TRANSFER_TOKEN_SALT=your_transfer_token_salt_here

# Server Configuration
HOST=0.0.0.0
PORT=1337
APP_KEYS=your_app_keys_here

# Editor de Texto Simples
# Editores ricos removidos - usando textarea nativo do Strapi
UPLOADCARE_PUBLIC_KEY=your_uploadcare_key_here

# Environment
NODE_ENV=development
```

**Explicação das Variáveis:**

- **DATABASE\_\***: Configurações do banco de dados
- **ADMIN\_\***: Configurações do painel admin
- **HOST/PORT**: Configurações do servidor
- **APP_KEYS**: Chaves de criptografia
- **EDITOR**: Configurações do editor de texto simples
- **NODE_ENV**: Ambiente de execução

---

## 📊 **ARQUIVOS DE CONFIGURAÇÃO DE MONITORAMENTO**

### **1. .husky/pre-commit - Hook Pre-commit**

**Localização:** `.husky/pre-commit`

**Propósito:** Script executado antes do commit

**Conteúdo:**

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

yarn lint-staged
```

**Explicação:**

- **#!/usr/bin/env sh**: Shebang para shell
- **husky.sh**: Script de configuração do Husky
- **yarn lint-staged**: Executa lint-staged

### **2. .husky/commit-msg - Hook Commit-msg**

**Localização:** `.husky/commit-msg`

**Propósito:** Validação da mensagem de commit

**Conteúdo:**

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx --no -- commitlint --edit $1
```

**Explicação:**

- **commitlint**: Valida formato da mensagem
- **--edit $1**: Arquivo temporário com a mensagem

---

## 🎯 **RESUMO DOS ARQUIVOS DE CONFIGURAÇÃO**

### **Arquivos Principais:**

1. **package.json** - Configuração do projeto e dependências
2. **tsconfig.json** - Configuração TypeScript
3. **.prettierrc.json** - Formatação de código
4. **.editorconfig** - Configuração de editores
5. **.gitignore** - Arquivos ignorados pelo Git

### **Arquivos de Testes:**

1. **vitest.config.ts** - Configuração Vitest
2. **playwright.config.ts** - Configuração Playwright

### **Arquivos de Qualidade:**

1. **.lintstagedrc.js** - Linting em arquivos staged
2. **commitlint.config.js** - Validação de commits
3. **eslint.config.js** - Regras de linting

### **Arquivos de Deployment:**

1. **Dockerfile** - Containerização
2. **.dockerignore** - Arquivos ignorados pelo Docker
3. **.env.example** - Template de variáveis de ambiente

### **Arquivos de Git:**

1. **.husky/** - Hooks do Git
2. **yarn.lock** - Lock de dependências
3. **.strapi-updater.json** - Configuração do Strapi

---

**Documentação gerada em:** 14/08/2025 **Última atualização:** Configuração completa dos arquivos de
configuração
