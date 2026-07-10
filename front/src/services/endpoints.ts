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
    settle: (id: string) => `/duels/${id}/settle`,
  },
  bets: {
    base: '/bets',
    settle: (id: string) => `/bets/${id}/settle`,
    build: '/bets/build',
  },
} as const;
