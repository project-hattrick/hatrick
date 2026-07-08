import type { en } from './en';

type DictionaryShape<T> = {
  [K in keyof T]: T[K] extends string ? string : DictionaryShape<T[K]>;
};

export const ptBR: DictionaryShape<typeof en> = {
  common: {
    searchPlayers: 'Buscar jogadores',
    addCoins: 'Adicionar moedas',
    home: 'Inicio do Hat-trick',
    navigation: 'Navegacao',
    openNavigation: 'Abrir menu de navegacao',
    changeLanguage: 'Trocar idioma',
    backHome: 'Voltar ao inicio',
    tryAgain: 'Tentar novamente',
    goHome: 'Ir para o inicio',
  },
  nav: {
    games: 'Jogos',
    duelists: 'Duelistas',
    store: 'Loja',
    fixtures: 'Partidas',
    fantasy: 'Fantasy',
    market: 'Mercado',
    bets: 'Apostas',
  },
  search: {
    title: 'Buscar jogadores',
    description: 'Encontre um jogador pelo nome e abra o perfil.',
    placeholder: 'Buscar jogadores...',
    empty: 'Digite um nome para encontrar um jogador, desafiar ou adicionar.',
    searching: 'Buscando...',
    noResults: 'Nenhum jogador combina com "{query}".',
    browseAll: 'Ver todos os duelistas',
  },
  errors: {
    title: 'Algo deu errado',
    body: 'Ocorreu um erro inesperado ao carregar esta tela. Tente novamente ou volte ao inicio.',
    notFound: 'A partida que voce procura nao esta em campo - ela pode ter mudado ou nunca ter existido.',
  },
};
