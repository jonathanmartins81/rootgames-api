/**
 * 🎮 RootGames - Tipos TypeScript para Entidades de Jogos
 *
 * Este arquivo contém todas as definições de tipos TypeScript para:
 * - Entidades principais (Game, Category, Platform, etc.)
 * - Interfaces de mídia e arquivos
 * - Tipos para filtros e busca
 * - Interfaces de resposta da API
 * - Tipos para otimização de imagens
 *
 * @author Jonathan Martins
 * @version 1.0.0
 * @since 2025
 */

/**
 * 🎮 Interface Principal - Jogo
 *
 * Representa um jogo na plataforma RootGames com todas suas propriedades
 * e relacionamentos com outras entidades.
 */
export interface Game {
  id: number; // ID único do jogo
  name: string; // Nome do jogo
  slug: string; // Slug para URLs amigáveis
  short_description?: string; // Descrição curta (opcional)
  description?: string; // Descrição completa (opcional)
  price: number; // Preço do jogo
  release_date?: string; // Data de lançamento (opcional)
  rating?: 'BR0' | 'BR10' | 'BR12' | 'BR14' | 'BR16' | 'BR18'; // Classificação indicativa
  cover?: MediaFile; // Imagem de capa (opcional)
  gallery?: MediaFile[]; // Galeria de imagens (opcional)
  categories?: Category[]; // Categorias do jogo (opcional)
  platforms?: Platform[]; // Plataformas suportadas (opcional)
  developers?: Developer[]; // Desenvolvedores (opcional)
  publisher?: Publisher; // Publicadora (opcional)
  createdAt: string; // Data de criação
  updatedAt: string; // Data de atualização
  publishedAt?: string; // Data de publicação (opcional)
}

/**
 * 📂 Interface - Categoria
 *
 * Representa uma categoria de jogos (ex: Ação, RPG, Estratégia)
 */
export interface Category {
  id: number; // ID único da categoria
  name: string; // Nome da categoria
  slug: string; // Slug para URLs amigáveis
  description?: string; // Descrição da categoria
  icon?: string; // Ícone da categoria (emoji ou classe CSS)
  color?: string; // Cor da categoria (hex)
  is_active: boolean; // Se a categoria está ativa
  sort_order: number; // Ordem de exibição
  games?: Game[]; // Jogos desta categoria
  createdAt: string; // Data de criação
  updatedAt: string; // Data de atualização
}

/**
 * 🎮 Interface - Plataforma
 *
 * Representa uma plataforma de jogos (ex: PC, PlayStation, Xbox)
 */
export interface Platform {
  id: number; // ID único da plataforma
  name: string; // Nome da plataforma
  slug: string; // Slug para URLs amigáveis
  description?: string; // Descrição da plataforma
  logo?: MediaFile; // Logo da plataforma
  company?: string; // Empresa responsável
  release_year?: number; // Ano de lançamento
  is_active: boolean; // Se a plataforma está ativa
  sort_order: number; // Ordem de exibição
  games?: Game[]; // Jogos desta plataforma
  createdAt: string; // Data de criação
  updatedAt: string; // Data de atualização
}

/**
 * 👨‍💻 Interface - Desenvolvedor
 *
 * Representa um desenvolvedor de jogos
 */
export interface Developer {
  id: number; // ID único do desenvolvedor
  name: string; // Nome do desenvolvedor
  slug: string; // Slug para URLs amigáveis
  description?: string; // Descrição do desenvolvedor
  logo?: MediaFile; // Logo do desenvolvedor
  website?: string; // Site oficial
  country?: string; // País de origem
  founded_year?: number; // Ano de fundação
  is_active: boolean; // Se o desenvolvedor está ativo
  sort_order: number; // Ordem de exibição
  games?: Game[]; // Jogos deste desenvolvedor
  createdAt: string; // Data de criação
  updatedAt: string; // Data de atualização
}

/**
 * 🏢 Interface - Publicadora
 *
 * Representa uma publicadora de jogos
 */
export interface Publisher {
  id: number; // ID único da publicadora
  name: string; // Nome da publicadora
  slug: string; // Slug para URLs amigáveis
  description?: string; // Descrição da publicadora
  logo?: MediaFile; // Logo da publicadora
  website?: string; // Site oficial
  country?: string; // País de origem
  founded_year?: number; // Ano de fundação
  is_active: boolean; // Se a publicadora está ativa
  sort_order: number; // Ordem de exibição
  games?: Game[]; // Jogos desta publicadora
  createdAt: string; // Data de criação
  updatedAt: string; // Data de atualização
}

/**
 * 📁 Interface - Arquivo de Mídia
 *
 * Representa um arquivo de mídia (imagem, vídeo, etc.)
 */
export interface MediaFile {
  id: number; // ID único do arquivo
  name: string; // Nome do arquivo
  alternativeText?: string; // Texto alternativo para acessibilidade
  caption?: string; // Legenda da mídia
  width?: number; // Largura da imagem
  height?: number; // Altura da imagem
  formats?: {
    // Formatos otimizados
    thumbnail?: MediaFormat; // Thumbnail pequeno
    small?: MediaFormat; // Versão pequena
    medium?: MediaFormat; // Versão média
    large?: MediaFormat; // Versão grande
  };
  hash: string; // Hash único do arquivo
  ext?: string; // Extensão do arquivo
  mime: string; // Tipo MIME
  size: number; // Tamanho em bytes
  url: string; // URL de acesso
  previewUrl?: string; // URL de preview
  provider: string; // Provedor de armazenamento
  provider_metadata?: any; // Metadados do provedor
  createdAt: string; // Data de criação
  updatedAt: string; // Data de atualização
}

/**
 * 📐 Interface - Formato de Mídia
 *
 * Representa um formato específico de um arquivo de mídia
 */
export interface MediaFormat {
  name: string; // Nome do formato
  hash: string; // Hash único do arquivo
  ext: string; // Extensão do arquivo
  mime: string; // Tipo MIME
  width: number; // Largura da imagem
  height: number; // Altura da imagem
  size: number; // Tamanho em bytes
  url: string; // URL de acesso
}

/**
 * 🔍 Interface - Filtros de Busca
 *
 * Define os filtros disponíveis para busca de jogos
 */
export interface GameFilters {
  name?: string; // Nome do jogo (busca parcial)
  price_min?: number; // Preço mínimo
  price_max?: number; // Preço máximo
  rating?: string; // Classificação indicativa
  category?: string; // Slug da categoria
  platform?: string; // Slug da plataforma
  developer?: string; // Slug do desenvolvedor
  publisher?: string; // Slug da publicadora
  release_date_from?: string; // Data de lançamento (início)
  release_date_to?: string; // Data de lançamento (fim)
}

/**
 * 📊 Interface - Ordenação
 *
 * Define como os resultados devem ser ordenados
 */
export interface GameSort {
  field: 'name' | 'price' | 'release_date' | 'createdAt' | 'updatedAt'; // Campo para ordenação
  order: 'asc' | 'desc'; // Direção da ordenação
}

/**
 * 📄 Interface - Metadados de Paginação
 *
 * Informações sobre a paginação dos resultados
 */
export interface PaginationMeta {
  page: number; // Página atual
  pageSize: number; // Tamanho da página
  pageCount: number; // Total de páginas
  total: number; // Total de itens
}

/**
 * 📡 Interface - Resposta da API
 *
 * Estrutura padrão para respostas da API
 */
export interface ApiResponse<T> {
  data: T; // Dados da resposta
  meta: {
    // Metadados
    pagination: PaginationMeta; // Informações de paginação
    [key: string]: any; // Outros metadados
  };
}

/**
 * 🔎 Interface - Parâmetros de Busca
 *
 * Parâmetros completos para busca de jogos
 */
export interface GameSearchParams {
  filters?: GameFilters; // Filtros aplicados
  sort?: GameSort; // Ordenação
  pagination?: {
    // Configuração de paginação
    page?: number; // Página desejada
    pageSize?: number; // Tamanho da página
  };
  populate?: string[]; // Relacionamentos a incluir
}

/**
 * 📈 Interface - Estatísticas
 *
 * Estatísticas gerais da plataforma
 */
export interface GameStats {
  totalGames: number; // Total de jogos
  averagePrice: number; // Preço médio
  totalCategories: number; // Total de categorias
  totalPlatforms: number; // Total de plataformas
  totalDevelopers: number; // Total de desenvolvedores
  totalPublishers: number; // Total de publicadoras
  priceRange: {
    min: number; // Preço mínimo
    max: number; // Preço máximo
  };
  ratingDistribution: {
    [key: string]: number; // Distribuição por classificação
  };
}

/**
 * 🖼️ Interface - Resultado de Otimização de Imagem
 *
 * Resultado do processo de otimização de imagem
 */
export interface ImageOptimizationResult {
  originalSize: number; // Tamanho original em bytes
  optimizedSize: number; // Tamanho otimizado em bytes
  compressionRatio: number; // Percentual de compressão
  format: string; // Formato final
  path: string; // Caminho do arquivo otimizado
  success: boolean; // Se a otimização foi bem-sucedida
  error?: string; // Mensagem de erro (se houver)
}

/**
 * ⚙️ Interface - Opções de Otimização
 *
 * Configurações para otimização de imagens
 */
export interface OptimizationOptions {
  quality?: number; // Qualidade da imagem (0-100)
  format?: 'jpeg' | 'png' | 'webp'; // Formato de saída
  width?: number; // Largura desejada
  height?: number; // Altura desejada
  resize?: boolean; // Se deve redimensionar
}
