export const home = {
  srTitle: 'Hatrick - Live и Fantasy футбол для чемпионата мира',
  site: {
    title: 'Hatrick - Live и Fantasy футбол на одной платформе',
    description:
      'Одна платформа, два способа жить чемпионатом мира: прогнозируйте и ставьте на реальные матчи в Live Mode или соберите свой XI и играйте дуэли 1v1 с друзьями в Fantasy - на базе фида TxLINE в реальном времени.',
  },
  footer: {
    tagline: 'Платформа, которая помещает вас в центр игры: live, fantasy и прогнозы в одном месте.',
    getApp: 'Получить приложение',
    copyright: '© 2026 Hatrick. Все права защищены.',
    disclaimer: 'Devnet demo · только игровые деньги · не связано с FIFA.',
    socials: {
      x: 'X / Twitter',
    },
    badges: {
      appStore: { store: 'App Store', tagline: 'Скачать в' },
      googlePlay: { store: 'Google Play', tagline: 'Доступно в' },
    },
    columns: [
      {
        title: 'Навигация',
        links: [
          { label: 'Главная', href: '/' },
          { label: 'Live Mode', href: '/live' },
          { label: 'Fantasy', href: '/fantasy' },
          { label: 'Дуэлянты', href: '/duelists' },
        ],
      },
      {
        title: 'Разделы',
        links: [
          { label: 'Магазин', href: '/store' },
          { label: 'Блог', href: '/blog' },
          { label: 'FAQ', href: '/faq' },
          { label: 'О проекте', href: '/about' },
          { label: 'Контакты', href: '/contact' },
        ],
      },
      {
        title: 'Юридическое',
        links: [
          { label: 'Условия использования', href: '/legal/terms' },
          { label: 'Политика конфиденциальности', href: '/legal/privacy' },
          { label: 'Ответственная игра', href: '/legal/responsible-gaming' },
          { label: 'Политика cookies', href: '/legal/cookies' },
        ],
      },
    ],
  },
  dashboard: {
    squadTitle: 'Ваш fantasy-состав',
    modesTitle: 'Два режима. Бесконечно способов победить.',
    greeting: 'Рады видеть вас снова',
    matchLoading: 'Загрузка матча...',
    matchSearch: 'Искать матчи или команды...',
  },
} as const;
