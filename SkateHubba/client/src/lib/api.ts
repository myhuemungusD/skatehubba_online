const API_BASE = import.meta.env.VITE_API_URL || '/api';

type RequestMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface RequestOptions {
  method?: RequestMethod;
  body?: unknown;
  token?: string | null;
  params?: Record<string, string | number | boolean | undefined>;
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, token, params } = options;

  // Build URL with query params
  let url = `${API_BASE}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

// ============ Products & Shop ============

export interface Product {
  id: number;
  name: string;
  description: string | null;
  category: string;
  price: number;
  imageUrl: string | null;
  inStock: boolean;
  stockQuantity: number | null;
}

export interface CartItem {
  productId: number;
  quantity: number;
}

export interface Order {
  id: number;
  status: string;
  totalAmount: number;
  createdAt: string;
  items: Array<{
    productId: number;
    quantity: number;
    priceAtPurchase: number;
    product: Product;
  }>;
}

export const shopApi = {
  getProducts: (params?: { category?: string; inStock?: boolean }) =>
    request<{ data: Product[] }>('/products', { params }),

  getProduct: (id: number) =>
    request<{ data: Product }>(`/products/${id}`),

  createPaymentIntent: (items: CartItem[], token: string) =>
    request<{ data: { clientSecret: string; amount: number } }>('/payment-intent', {
      method: 'POST',
      body: { items },
      token,
    }),

  createOrder: (data: { items: CartItem[]; stripePaymentIntentId: string }, token: string) =>
    request<{ data: Order }>('/orders', {
      method: 'POST',
      body: data,
      token,
    }),

  getOrders: (token: string) =>
    request<{ data: Order[] }>('/orders', { token }),
};

// ============ Spots ============

export interface Spot {
  id: number;
  name: string;
  description: string | null;
  latitude: number;
  longitude: number;
  city: string | null;
  country: string | null;
  difficulty: string | null;
  spotType: string | null;
  imageUrl: string | null;
  totalCheckIns: number;
  isVerified: boolean;
}

export interface CheckIn {
  id: number;
  userId: number;
  spotId: number;
  pointsEarned: number;
  createdAt: string;
  user?: {
    displayName: string;
    avatarUrl: string;
  };
}

export const spotsApi = {
  getSpots: (params?: {
    city?: string;
    spotType?: string;
    minLat?: number;
    maxLat?: number;
    minLng?: number;
    maxLng?: number;
    limit?: number;
    offset?: number;
  }) => request<{ data: Spot[]; total: number }>('/spots', { params }),

  getSpot: (id: number) =>
    request<{ data: Spot }>(`/spots/${id}`),

  createSpot: (data: Partial<Spot>, token: string) =>
    request<{ data: Spot }>('/spots', {
      method: 'POST',
      body: data,
      token,
    }),

  checkIn: (spotId: number, token: string) =>
    request<{ data: CheckIn }>(`/spots/${spotId}/check-in`, {
      method: 'POST',
      token,
    }),

  getCheckIns: (spotId: number) =>
    request<{ data: CheckIn[] }>(`/spots/${spotId}/check-ins`),

  getCities: () =>
    request<{ data: string[] }>('/spots/meta/cities'),
};

// ============ Inventory / Closet ============

export interface InventoryItem {
  id: number;
  productId: number;
  isEquipped: boolean;
  acquiredAt: string;
  product: Product;
}

export const inventoryApi = {
  getInventory: (token: string, equipped?: boolean) =>
    request<{ data: InventoryItem[] }>('/inventory', {
      token,
      params: equipped !== undefined ? { equipped } : undefined,
    }),

  getEquipped: (token: string) =>
    request<{ data: InventoryItem[] }>('/inventory/equipped', { token }),

  equipItem: (id: number, equip: boolean, token: string) =>
    request<{ data: InventoryItem }>(`/inventory/${id}/equip`, {
      method: 'POST',
      body: { equip },
      token,
    }),

  getStats: (token: string) =>
    request<{ data: { total: number; equipped: number; byCategory: Record<string, number> } }>(
      '/inventory/meta/stats',
      { token }
    ),
};

// ============ S.K.A.T.E. Games ============

export interface SkateGame {
  id: number;
  code: string;
  status: 'waiting' | 'active' | 'completed';
  maxPlayers: number;
  currentTurn: number;
  createdAt: string;
  hostId: number;
  host?: { displayName: string; avatarUrl: string };
  participants?: GameParticipant[];
}

export interface GameParticipant {
  id: number;
  gameId: number;
  userId: number;
  letters: string;
  isEliminated: boolean;
  position: number | null;
  user?: { displayName: string; avatarUrl: string };
}

export interface GameTurn {
  id: number;
  turnNumber: number;
  setterId: number;
  trickName: string;
  trickVideoUrl: string | null;
  status: 'pending' | 'completed';
  responses?: TurnResponse[];
}

export interface TurnResponse {
  id: number;
  responderId: number;
  landed: boolean;
  videoUrl: string | null;
  responder?: { displayName: string; avatarUrl: string };
}

export const gamesApi = {
  getGames: (params?: { status?: string; limit?: number }) =>
    request<{ data: SkateGame[] }>('/games', { params }),

  createGame: (maxPlayers: number, token: string) =>
    request<{ data: SkateGame }>('/games', {
      method: 'POST',
      body: { maxPlayers },
      token,
    }),

  getGame: (code: string, token: string) =>
    request<{ data: SkateGame }>(`/games/${code}`, { token }),

  joinGame: (code: string, token: string) =>
    request<{ data: GameParticipant }>(`/games/${code}/join`, {
      method: 'POST',
      token,
    }),

  startGame: (code: string, token: string) =>
    request<{ data: SkateGame }>(`/games/${code}/start`, {
      method: 'POST',
      token,
    }),

  setTrick: (code: string, trickName: string, trickVideoUrl: string | null, token: string) =>
    request<{ data: GameTurn }>(`/games/${code}/trick`, {
      method: 'POST',
      body: { trickName, trickVideoUrl },
      token,
    }),

  respondToTrick: (code: string, turnId: number, landed: boolean, videoUrl: string | null, token: string) =>
    request<{ data: TurnResponse }>(`/games/${code}/respond`, {
      method: 'POST',
      body: { turnId, landed, videoUrl },
      token,
    }),

  getTurns: (code: string, token: string) =>
    request<{ data: GameTurn[] }>(`/games/${code}/turns`, { token }),

  getHistory: (token: string) =>
    request<{ data: SkateGame[] }>('/games/user/history', { token }),
};

// ============ Leaderboard ============

export interface LeaderboardEntry {
  id: number;
  userId: number;
  points: number;
  gamesPlayed: number;
  gamesWon: number;
  checkInsCount: number;
  period: string;
  spotId: number | null;
  user?: { displayName: string; avatarUrl: string };
  rank?: number;
}

export interface UserStats {
  points: number;
  gamesPlayed: number;
  gamesWon: number;
  checkInsCount: number;
  rank: number;
  totalUsers: number;
}

export const leaderboardApi = {
  getLeaderboard: (params?: { type?: string; spotId?: number; limit?: number; offset?: number }) =>
    request<{ data: LeaderboardEntry[]; total: number }>('/leaderboard', { params }),

  getUserStats: (userId: number) =>
    request<{ data: UserStats }>(`/leaderboard/user/${userId}`),

  getMyStats: (token: string) =>
    request<{ data: UserStats }>('/leaderboard/me', { token }),

  getTopSpots: (limit?: number) =>
    request<{ data: Array<Spot & { totalCheckIns: number }> }>('/leaderboard/top-spots', {
      params: limit ? { limit } : undefined,
    }),

  getRecentActivity: (limit?: number) =>
    request<{ data: Array<{ type: string; user: { displayName: string }; data: unknown; createdAt: string }> }>(
      '/leaderboard/recent-activity',
      { params: limit ? { limit } : undefined }
    ),
};
