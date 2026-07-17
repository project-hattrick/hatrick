/**
 * API route strings in one place (enums-over-magic-strings). Paths are relative
 * to `env.apiUrl`; the http client prefixes the base URL.
 */
export const endpoints = {
  auth: {
    nonce: '/auth/nonce',
    verify: '/auth/verify',
    email: '/auth/email',
    me: '/auth/me',
    logout: '/auth/logout',
  },
  users: {
    byId: (id: string) => `/users/${id}`,
    list: (limit: number) => `/users?limit=${limit}`,
    byUsername: (username: string) => `/users/username/${encodeURIComponent(username)}`,
  },
  wallet: {
    transactions: '/wallet/transactions',
  },
  market: {
    buy: '/market/buy',
    sell: '/market/sell',
  },
  store: {
    catalog: '/store/catalog',
    purchase: '/store/purchase',
  },
  fantasy: {
    cards: '/fantasy/cards',
    collection: '/fantasy/collection',
    openPack: '/fantasy/packs/open',
    squad: '/fantasy/squad',
  },
  duels: {
    base: '/duels',
    detail: (id: string) => `/duels/${id}`,
    matchmakingEnter: '/duels/matchmaking/enter',
    matchmakingLeave: '/duels/matchmaking/leave',
    join: (id: string) => `/duels/${id}/join`,
    settle: (id: string) => `/duels/${id}/settle`,
  },
  bets: {
    base: '/bets',
    settle: (id: string) => `/bets/${id}/settle`,
    build: '/bets/build',
  },
  rooms: {
    base: '/rooms',
    byId: (id: string) => `/rooms/${id}`,
    join: '/rooms/join',
    members: (id: string) => `/rooms/${id}/members`,
    messages: (id: string) => `/rooms/${id}/messages`,
  },
  notifications: {
    base: '/notifications',
    readAll: '/notifications/read-all',
    read: (id: string) => `/notifications/${id}/read`,
  },
  friends: {
    base: '/friends',
    requests: '/friends/requests',
    respond: '/friends/respond',
    byUser: (id: string) => `/friends/${id}`,
  },
  crowd: {
    message: '/crowd/message',
  },
  chain: {
    balance: '/chain/balance',
    confirm: '/chain/confirm',
    duels: {
      depositBuild: (duelId: string) => `/chain/duels/${duelId}/deposit/build`,
    },
    packs: {
      openBuild: '/chain/packs/open/build',
      fulfill: (packOpenId: string) => `/chain/packs/${packOpenId}/fulfill`,
    },
  },
} as const;
