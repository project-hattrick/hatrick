export const about = {
  metadata: {
    title: 'Sobre',
    description:
      'Hatrick é uma plataforma de Copa do Mundo com dois modos: preveja partidas ao vivo em tempo real ou monte seu XI e duele 1v1 com amigos, tudo com o feed da TxLINE.',
  },
  hero: {
    eyebrow: 'Hatrick',
    title: 'Uma plataforma, duas formas de viver a Copa do Mundo',
  },
  sections: {
    chooseMode: 'Escolha seu modo',
    poweredBy: 'Impulsionado por',
    txlineTitle: 'TxLINE - o feed em tempo real',
    values: 'Nossos valores',
    ready: 'Pronto para jogar?',
    readyBody: 'Conecte sua carteira Solana e entre na Copa do Mundo.',
  },
  modes: [
    {
      label: 'Modo Live',
      title: 'Partidas reais, emoção real',
      body: 'Acompanhe cada partida da Copa do Mundo enquanto ela acontece. O feed da TxLINE entrega gols, cartões e substituições em milissegundos. Faça previsões em mercados ao vivo e veja seu saldo reagir à ação em campo.',
      cta: 'Ir para Live',
    },
    {
      label: 'Modo Fantasy',
      title: 'Seu XI, suas regras',
      body: 'Monte um elenco com jogadores reais da Copa do Mundo, com atributos atualizados após cada evento confirmado. Depois escolha um rival no diretório de Duelistas e envie um desafio 1v1 - a arena 2D resolve a disputa.',
      cta: 'Montar seu elenco',
    },
  ],
  txline:
    'Cada evento que você vê no Hatrick vem da TxLINE, um stream seguro de Server-Sent Events que entrega dados confirmados de partidas em milissegundos após o apito. Gols liquidam suas apostas. Assistências aumentam a nota do seu jogador. Cartões vermelhos mudam a simulação. A TxLINE é a fonte única da verdade que mantém Live e Fantasy alinhados com a realidade.',
  tags: ['Eventos da partida', 'Estatísticas de jogadores', 'Liquidação de mercados', 'Recalculo de atributos'],
  values: [
    {
      title: 'Tudo em tempo real',
      body: 'Cada gol, cartão e substituição do feed da TxLINE entra nas odds do Live e nas atualizações de atributos do Fantasy em milissegundos.',
    },
    {
      title: 'Competitivo por design',
      body: 'De duelos 1v1 ranqueados a previsões em mercados ao vivo, o Hatrick foi criado para quem quer testar seu conhecimento de futebol contra adversários reais.',
    },
    {
      title: 'Palco global',
      body: '32 seleções, 64 partidas, uma plataforma. Cada jogo da Copa do Mundo é uma nova oportunidade - no Live, no Fantasy ou nos dois.',
    },
    {
      title: 'Transparente e justo',
      body: 'As liquidações acontecem na Solana Devnet e são verificáveis on-chain. Só dinheiro fictício - sem fundos reais, sem mecânicas escondidas.',
    },
    {
      title: 'Atributos baseados em dados',
      body: 'As notas dos jogadores não são palpites. Elas refletem métricas reais: gols, assistências, passes-chave, desarmes, defesas - recalculadas partida a partida.',
    },
    {
      title: 'Social no centro',
      body: 'Adicione amigos, desafie rivais e acompanhe confrontos diretos. O diretório de Duelistas coloca toda a comunidade Hatrick a uma busca de distância.',
    },
  ],
} as const;
