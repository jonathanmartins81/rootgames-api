# 📚 Documentação - RootGames API

Bem-vindo à documentação completa do projeto **RootGames API**! Esta pasta contém toda a documentação necessária para configurar, usar e manter a API.

---

## 📋 Índice da Documentação

### 🚀 **Configuração e Setup**

- **[Configuração do Strapi](./STRAPI_CONFIGURATION.md)** - Guia completo de instalação e configuração
- **[Documentação da API](./API_DOCUMENTATION.md)** - Endpoints, exemplos e funcionalidades

### 📖 **Documentação Adicional**

- **[Roadmap 2025](../ROADMAP_2025.md)** - Planejamento e objetivos para 2025
- **[README Principal](../README.md)** - Visão geral do projeto

---

## 🎯 **Início Rápido**

### **1. Configuração Inicial**

```bash
# Clone o repositório
git clone <repository-url>
cd rootgames-api

# Instale as dependências
yarn install

# Configure o banco de dados PostgreSQL
# (veja STRAPI_CONFIGURATION.md para detalhes)

# Crie o arquivo .env com as configurações
cp .env.example .env
# Edite o arquivo .env com suas configurações

# Inicie o servidor
yarn develop
```

### **2. Acessos Principais**

- **Admin Panel**: http://localhost:1337/admin
- **API REST**: http://localhost:1337/api
- **GraphQL**: http://localhost:1337/graphql

### **3. Primeiros Passos**

1. Acesse o Admin Panel
2. Crie seu usuário administrador
3. Configure as permissões da API
4. Teste a funcionalidade de populate

---

## 🔧 **Arquitetura do Projeto**

```
rootgames-api/
├── config/                 # Configurações do Strapi
├── src/
│   ├── api/               # APIs e entidades
│   │   ├── game/         # Entidade de jogos
│   │   ├── category/     # Entidade de categorias
│   │   ├── platform/     # Entidade de plataformas
│   │   ├── developer/    # Entidade de desenvolvedores
│   │   └── publisher/    # Entidade de publicadores
│   ├── admin/            # Customizações do painel admin
│   └── extensions/       # Extensões personalizadas
├── database/             # Migrações e dados
├── public/               # Arquivos públicos
├── docs/                 # Documentação (esta pasta)
└── patches/              # Patches personalizados
```

---

## 📊 **Modelo de Dados**

### **Entidades Principais**

- **Games** - Jogos do catálogo
- **Categories** - Categorias/gêneros
- **Platforms** - Plataformas (PC, PS5, Xbox, etc.)
- **Developers** - Desenvolvedores
- **Publishers** - Publicadores

### **Relacionamentos**

- Games ↔ Categories: Many-to-Many
- Games ↔ Platforms: Many-to-Many
- Games ↔ Developers: Many-to-Many
- Games ↔ Publisher: Many-to-One

---

## 🚀 **Funcionalidades Principais**

### **✅ Implementadas**

- ✅ API REST completa
- ✅ API GraphQL
- ✅ Sistema de upload de mídia
- ✅ Importação automática da GOG
- ✅ Painel administrativo customizado
- ✅ Sistema de permissões
- ✅ Editor rico CKEditor

### **🔄 Em Desenvolvimento**

- 🔄 Sistema de usuários avançado
- 🔄 Reviews e avaliações
- 🔄 Wishlist e favoritos
- 🔄 Notificações

### **📋 Planejadas**

- 📋 Integração multi-loja
- 📋 Sistema de preços dinâmicos
- 📋 Analytics e relatórios
- 📋 Mobile app

---

## 🔐 **Segurança**

### **Configurações de Produção**

- Use HTTPS sempre
- Configure chaves seguras
- Implemente rate limiting
- Configure CORS adequadamente
- Faça backups regulares

### **Autenticação**

- Tokens de API para aplicações
- JWT para usuários
- Roles e permissões granulares

---

## 🐛 **Suporte e Troubleshooting**

### **Problemas Comuns**

1. **Erro de conexão com PostgreSQL**
   - Verifique se o serviço está rodando
   - Confirme as credenciais no .env
   - Teste a conexão manualmente

2. **Erro de compilação TypeScript**
   - Limpe o cache: `rm -rf .cache dist`
   - Reinstale dependências: `yarn install`

3. **Erro de permissões**
   - Verifique as permissões do PostgreSQL
   - Confirme as configurações do pg_hba.conf

### **Logs Úteis**

```bash
# Logs do Strapi
tail -f .tmp/logs/strapi.log

# Logs do PostgreSQL
sudo journalctl -u postgresql -f

# Logs do sistema
sudo journalctl -f
```

---

## 📞 **Contato e Suporte**

### **Recursos**

- **Documentação Oficial**: [docs.strapi.io](https://docs.strapi.io/)
- **Fórum Strapi**: [forum.strapi.io](https://forum.strapi.io/)
- **Discord Strapi**: [discord.strapi.io](https://discord.strapi.io/)

### **Comunidade**

- **GitHub Issues**: Para reportar bugs
- **Pull Requests**: Para contribuições
- **Discussions**: Para discussões gerais

---

## 📝 **Contribuindo**

### **Como Contribuir**

1. Fork o repositório
2. Crie uma branch para sua feature
3. Faça suas alterações
4. Teste adequadamente
5. Submeta um Pull Request

### **Padrões de Código**

- Use TypeScript
- Siga as convenções do Strapi
- Documente novas funcionalidades
- Mantenha testes atualizados

---

## 📄 **Licença**

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](../LICENSE) para mais detalhes.

---

## 🎉 **Agradecimentos**

- **Strapi Team** - Pelo excelente CMS
- **GOG.com** - Pela API de jogos
- **Comunidade Open Source** - Pelas contribuições

---

_Última atualização: Agosto 2025_
_Versão da Documentação: 1.0.0_

---

**💡 Dica**: Mantenha esta documentação atualizada conforme o projeto evolui. Documentação boa é essencial para o sucesso do projeto!
