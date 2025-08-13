# CKEditor 5 - Configuração e Uso

## 📝 Visão Geral

O **CKEditor 5** é um editor de texto rico moderno e poderoso que foi integrado ao projeto RootGames
API para fornecer uma experiência de edição de conteúdo superior.

### ✨ Características Principais

- **Editor WYSIWYG** (What You See Is What You Get)
- **Interface moderna** e responsiva
- **Suporte a imagens** com upload integrado
- **Tabelas** com formatação avançada
- **Links** com validação automática
- **Mídia embutida** (YouTube, Vimeo, etc.)
- **Formatação de texto** completa

## 🚀 Instalação

O CKEditor 5 já está instalado e configurado no projeto:

```bash
# Plugin já instalado
yarn add @ckeditor/strapi-plugin-ckeditor
```

## ⚙️ Configuração

### Arquivo de Configuração: `config/plugins.js`

```javascript
module.exports = ({ env }) => ({
  ckeditor: {
    enabled: true,
    config: {
      editor: {
        // Barra de ferramentas personalizada
        toolbar: {
          items: [
            'heading',
            '|',
            'bold',
            'italic',
            'link',
            'bulletedList',
            'numberedList',
            '|',
            'outdent',
            'indent',
            '|',
            'imageUpload',
            'blockQuote',
            'insertTable',
            'mediaEmbed',
            'undo',
            'redo',
          ],
        },
        // Configuração de upload de imagens
        image: { upload: { types: ['jpeg', 'png', 'gif', 'webp'] } },
        // Configuração de tabelas
        table: { contentToolbar: ['tableColumn', 'tableRow', 'mergeTableCells'] },
        // Configuração de links
        link: { decorators: { addTargetToExternalLinks: true, defaultProtocol: 'https://' } },
      },
    },
  },
});
```

## 🎯 Uso no Strapi

### Campos Compatíveis

O CKEditor 5 é automaticamente aplicado aos campos do tipo `richtext`:

```json
{ "description": { "type": "richtext" } }
```

### Campos Atuais com CKEditor

- **Game.description** - Descrição detalhada do jogo
- **Category.description** - Descrição da categoria
- **Developer.description** - Descrição do desenvolvedor
- **Publisher.description** - Descrição da publisher

## 🛠️ Funcionalidades Disponíveis

### 📝 Formatação de Texto

- **Cabeçalhos** (H1, H2, H3, etc.)
- **Negrito** e _Itálico_
- **Listas** numeradas e com marcadores
- **Recuo** e alinhamento
- **Citações** em bloco

### 🖼️ Imagens

- **Upload direto** de imagens
- **Formatos suportados**: JPEG, PNG, GIF, WebP
- **Redimensionamento** automático
- **Alt text** para acessibilidade

### 📊 Tabelas

- **Inserção** de tabelas
- **Adição/remoção** de linhas e colunas
- **Mesclagem** de células
- **Formatação** de bordas

### 🔗 Links

- **Inserção** de URLs
- **Validação** automática
- **Abertura** em nova aba (links externos)
- **Protocolo HTTPS** padrão

### 🎥 Mídia

- **Embed** de vídeos (YouTube, Vimeo)
- **Embed** de áudios
- **Embed** de mapas

## 🎨 Personalização

### Adicionar Novos Botões

Para adicionar novos botões à barra de ferramentas, edite o arquivo `config/plugins.js`:

```javascript
toolbar: {
  items: [
    'heading',
    '|',
    'bold',
    'italic',
    'link',
    'bulletedList',
    'numberedList',
    '|',
    'outdent',
    'indent',
    '|',
    'imageUpload',
    'blockQuote',
    'insertTable',
    'mediaEmbed',
    'code', // Novo botão
    'codeBlock', // Novo botão
    'undo',
    'redo',
  ];
}
```

### Configurar Upload de Imagens

```javascript
image: {
  upload: {
    types: ['jpeg', 'png', 'gif', 'webp', 'svg'], // Adicionar SVG
    maxSize: 5242880 // 5MB em bytes
  }
}
```

## 🔧 Desenvolvimento

### Adicionar CKEditor a Novos Campos

1. **Editar o Schema** do content type:

```json
{ "attributes": { "content": { "type": "richtext", "required": false } } }
```

2. **Reiniciar o servidor**:

```bash
yarn develop
```

### Plugins Adicionais

Para adicionar plugins do CKEditor 5:

```bash
# Exemplo: Plugin de código
yarn add @ckeditor/ckeditor5-code-block
```

E configurar no `config/plugins.js`:

```javascript
toolbar: {
  items: [
    // ... outros itens
    'code',
    'codeBlock',
  ];
}
```

## 🐛 Troubleshooting

### Problema: CKEditor não aparece

**Solução:**

1. Verificar se o plugin está habilitado em `config/plugins.js`
2. Confirmar que o campo é do tipo `richtext`
3. Reiniciar o servidor Strapi

### Problema: Upload de imagens não funciona

**Solução:**

1. Verificar permissões de upload no Strapi
2. Confirmar configuração de tipos de arquivo
3. Verificar espaço em disco

### Problema: Editor não carrega

**Solução:**

1. Limpar cache do navegador
2. Verificar console do navegador para erros
3. Reinstalar dependências: `yarn install`

## 📚 Recursos Adicionais

- [Documentação Oficial CKEditor 5](https://ckeditor.com/docs/ckeditor5/latest/)
- [Plugin Strapi CKEditor](https://github.com/ckeditor/strapi-plugin-ckeditor)
- [Exemplos de Configuração](https://ckeditor.com/docs/ckeditor5/latest/builds/guides/integration/configuration.html)

## 🎯 Próximos Passos

- [ ] Configurar upload personalizado de imagens
- [ ] Adicionar plugins de código (syntax highlighting)
- [ ] Implementar autosave
- [ ] Configurar templates de conteúdo
- [ ] Adicionar validação customizada

---

**Versão**: 1.0.0 **Última atualização**: Agosto 2025 **Status**: ✅ Ativo e Funcionando
