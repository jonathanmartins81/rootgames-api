export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat', // Nova funcionalidade
        'fix', // Correção de bug
        'docs', // Documentação
        'style', // Formatação, ponto e vírgula, etc
        'refactor', // Refatoração de código
        'perf', // Melhoria de performance
        'test', // Adicionando testes
        'chore', // Tarefas de manutenção
        'ci', // Mudanças em CI/CD
        'build', // Mudanças no sistema de build
        'revert', // Reverter commit anterior
        'wip', // Work in progress
        'temp', // Arquivos temporários
      ],
    ],
    'type-case': [2, 'always', 'lowerCase'],
    'type-empty': [2, 'never'],
    'subject-case': [2, 'always', 'lowerCase'],
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],
    'subject-max-length': [2, 'always', 72],
    'body-leading-blank': [2, 'always'],
    'body-max-line-length': [2, 'always', 100],
    'footer-leading-blank': [2, 'always'],
    'footer-max-line-length': [2, 'always', 100],
  },
};
