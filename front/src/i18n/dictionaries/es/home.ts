export const home = {
  srTitle: 'Hatrick - fútbol Live y Fantasy para el Mundial',
  site: {
    title: 'Hatrick - fútbol Live y Fantasy, una plataforma',
    description:
      'Una plataforma, dos formas de vivir el Mundial: predice y apuesta en partidos reales en Modo Live, o crea tu XI y reta amigos 1v1 en Fantasy, impulsado por el feed en tiempo real de TxLINE.',
  },
  footer: {
    tagline: 'La plataforma que te pone en el centro del juego: live, fantasy y predicciones en un solo lugar.',
    getApp: 'Obtener la app',
    copyright: '© 2026 Hatrick. Todos los derechos reservados.',
    disclaimer: 'Demo devnet · solo dinero ficticio · no afiliado con FIFA.',
    socials: {
      website: 'Sitio web',
      community: 'Comunidad',
      telegram: 'Telegram',
      email: 'Email',
    },
    badges: {
      appStore: { store: 'App Store', tagline: 'Descárgala en' },
      googlePlay: { store: 'Google Play', tagline: 'Consíguela en' },
    },
    columns: [
      {
        title: 'Navegación',
        links: [
          { label: 'Inicio', href: '/' },
          { label: 'Modo Live', href: '/live' },
          { label: 'Fantasy', href: '/fantasy' },
          { label: 'Duelistas', href: '/duelists' },
        ],
      },
      {
        title: 'Explorar',
        links: [
          { label: 'Tienda', href: '/store' },
          { label: 'Blog', href: '/blog' },
          { label: 'FAQ', href: '/faq' },
          { label: 'Acerca de', href: '/about' },
          { label: 'Contacto', href: '/contact' },
        ],
      },
      {
        title: 'Legal',
        links: [
          { label: 'Términos de Uso', href: '/legal/terms' },
          { label: 'Política de Privacidad', href: '/legal/privacy' },
          { label: 'Juego Responsable', href: '/legal/responsible-gaming' },
          { label: 'Política de Cookies', href: '/legal/cookies' },
        ],
      },
    ],
  },
  dashboard: {
    squadTitle: 'Tu plantilla fantasy',
    modesTitle: 'Dos modos. Infinitas formas de ganar.',
    greeting: 'Qué bueno verte de nuevo',
    matchLoading: 'Cargando partido...',
    matchSearch: 'Buscar partidos o equipos...',
  },
} as const;
