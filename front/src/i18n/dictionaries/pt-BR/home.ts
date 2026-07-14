export const home = {
  srTitle: 'Hatrick - futebol Live e Fantasy para a Copa do Mundo',
  site: {
    title: 'Hatrick - futebol Live e Fantasy em uma só plataforma',
    description:
      'Uma plataforma, duas formas de viver a Copa do Mundo: preveja e aposte em partidas reais no Modo Live ou monte seu XI e duele 1v1 com amigos no Fantasy - tudo com o feed em tempo real da TxLINE.',
  },
  footer: {
    tagline: 'A plataforma que coloca você no centro do jogo - live, fantasy e previsões em um só lugar.',
    getApp: 'Baixe o app',
    copyright: '© 2026 Hatrick. Todos os direitos reservados.',
    disclaimer: 'Demo devnet · dinheiro fictício · sem afiliação com a FIFA.',
    socials: {
      x: 'X / Twitter',
    },
    badges: {
      appStore: { store: 'App Store', tagline: 'Baixe na' },
      googlePlay: { store: 'Google Play', tagline: 'Disponível no' },
    },
    columns: [
      {
        title: 'Navegação',
        links: [
          { label: 'Início', href: '/' },
          { label: 'Modo Live', href: '/live' },
          { label: 'Fantasy', href: '/fantasy' },
          { label: 'Duelistas', href: '/duelists' },
        ],
      },
      {
        title: 'Explorar',
        links: [
          { label: 'Loja', href: '/store' },
          { label: 'Blog', href: '/blog' },
          { label: 'FAQ', href: '/faq' },
          { label: 'Sobre', href: '/about' },
          { label: 'Contato', href: '/contact' },
        ],
      },
      {
        title: 'Legal',
        links: [
          { label: 'Termos de Uso', href: '/legal/terms' },
          { label: 'Política de Privacidade', href: '/legal/privacy' },
          { label: 'Jogo Responsável', href: '/legal/responsible-gaming' },
          { label: 'Política de Cookies', href: '/legal/cookies' },
        ],
      },
    ],
  },
  dashboard: {
    squadTitle: 'Seu elenco fantasy',
    modesTitle: 'Dois modos. Infinitas formas de vencer.',
    greeting: 'Bom ver você de novo',
    matchLoading: 'Carregando partida...',
    matchSearch: 'Buscar partidas ou seleções...',
  },
} as const;
