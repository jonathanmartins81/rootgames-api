/**
 * 🎮 RootGames Admin Panel - Configuração Principal
 *
 * Este arquivo configura o painel administrativo do Strapi, incluindo:
 * - Tema personalizado para gaming
 * - Traduções customizadas
 * - Configurações de cores e estilos
 * - Bootstrap do tema escuro
 *
 * @author Jonathan Martins
 * @version 1.0.0
 * @since 2025
 */

// Importações de recursos visuais
import Icon from './extensions/icon.png'; // Ícone do favicon
import Logo from './extensions/logo.svg'; // Logo da aplicação
import './extensions/theme.css'; // CSS personalizado

export default {
  /**
   * ⚙️ Configuração Principal do Admin Panel
   */
  config: {
    // 🔐 Configurações de Autenticação
    auth: {
      logo: Logo, // Logo exibido na tela de login
    },

    // 🎯 Configurações do Head
    head: {
      favicon: Icon, // Ícone da aba do navegador
    },

    // 🌍 Configurações de Localização
    locales: [], // Locales disponíveis (vazio = apenas inglês)

    // 📝 Traduções Customizadas
    translations: {
      en: {
        'Auth.form.welcome.title': 'Welcome to Root Games!', // Título da tela de login
        'Auth.form.welcome.subtitle': 'Your Ultimate Gaming Marketplace', // Subtítulo da tela de login
        'app.components.LeftMenu.navbrand.title': 'Root Games Dashboard', // Título do menu lateral
      },
    },

    // 📋 Configurações do Menu
    menu: {
      logo: Icon, // Logo no menu lateral
    },

    /**
     * 🎨 Configuração do Tema
     * Define as cores e estilos do painel administrativo
     */
    theme: {
      // ☀️ Tema Claro
      light: {
        colors: {
          // Gradientes modernos para tema claro
          primary100: '#f0f9ff', // Azul muito claro
          primary200: '#e0f2fe', // Azul claro
          primary500: '#0ea5e9', // Azul principal
          primary600: '#0284c7', // Azul escuro
          primary700: '#0369a1', // Azul muito escuro
          buttonPrimary500: '#0ea5e9', // Cor dos botões primários
          buttonPrimary600: '#0284c7', // Cor dos botões primários (hover)

          // Cores de sucesso vibrantes
          success500: '#10b981', // Verde sucesso
          success600: '#059669', // Verde sucesso escuro

          // Cores de aviso
          warning500: '#f59e0b', // Laranja aviso
          warning600: '#d97706', // Laranja aviso escuro

          // Cores de erro
          danger500: '#ef4444', // Vermelho erro
          danger600: '#dc2626', // Vermelho erro escuro
        },
      },

      // 🌙 Tema Escuro (Padrão)
      dark: {
        colors: {
          // Tema escuro moderno com gradientes
          primary100: '#1e1b4b', // Roxo muito escuro
          primary200: '#312e81', // Roxo escuro
          primary500: '#8b5cf6', // Roxo principal
          primary600: '#7c3aed', // Roxo escuro
          primary700: '#6d28d9', // Roxo muito escuro
          buttonPrimary500: '#8b5cf6', // Cor dos botões primários
          buttonPrimary600: '#7c3aed', // Cor dos botões primários (hover)

          // Neutros modernos
          neutral0: '#0f0f23', // Fundo principal
          neutral100: '#1a1a2e', // Fundo secundário
          neutral150: '#16213e', // Fundo terciário
          neutral200: '#0f3460', // Fundo quaternário
          neutral300: '#533483', // Neutro médio
          neutral400: '#6b21a8', // Neutro médio-claro
          neutral500: '#8b5cf6', // Neutro principal
          neutral600: '#a78bfa', // Neutro claro
          neutral700: '#c4b5fd', // Neutro muito claro
          neutral800: '#ddd6fe', // Neutro extremamente claro
          neutral900: '#f3f4f6', // Neutro branco

          // Cores de destaque vibrantes
          danger500: '#ef4444', // Vermelho erro
          danger600: '#dc2626', // Vermelho erro escuro
          success500: '#10b981', // Verde sucesso
          success600: '#059669', // Verde sucesso escuro
          warning500: '#f59e0b', // Laranja aviso
          warning600: '#d97706', // Laranja aviso escuro

          // Cores especiais para jogos
          alternative100: '#1e1b4b', // Roxo alternativo
          alternative200: '#312e81', // Roxo alternativo claro
          alternative500: '#f231a5', // Rosa neon
          alternative600: '#e11d48', // Rosa escuro
          alternative700: '#be185d', // Rosa muito escuro
        },
      },
    },
  },

  /**
   * 🚀 Função de Bootstrap - Executada após a inicialização do admin
   *
   * Responsável por:
   * - Forçar o tema escuro
   * - Configurar localStorage
   * - Aplicar classes CSS
   * - Configurar animações
   */
  bootstrap() {
    // Forçar tema escuro moderno
    // eslint-disable-next-line no-console
    console.log('🎮 Root Games Admin Panel initialized with modern gaming theme');

    // Configurar tema padrão apenas no browser
    if (typeof window !== 'undefined') {
      // Definir tema escuro no localStorage
      localStorage.setItem('STRAPI_THEME', 'dark');
      localStorage.setItem('strapi-theme', 'dark');

      // Aplicar classe CSS para tema escuro
      document.documentElement.setAttribute('data-theme', 'dark');
      document.body.classList.add('theme-dark');

      // Aguardar carregamento e forçar tema
      setTimeout(() => {
        const themeToggle = document.querySelector('[data-testid="theme-toggle"]');
        if (themeToggle && !document.body.classList.contains('theme-dark')) {
          (themeToggle as HTMLElement).click();
        }
      }, 1000);
    }
  },
};
