module.exports = ({ env }) => ({
  ckeditor: {
    enabled: true,
    config: {
      editor: {
        // Configuração básica do CKEditor
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
