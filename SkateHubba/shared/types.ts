// Shared types for API requests/responses

// ============================================================================
// SHOP & COMMERCE
// ============================================================================

export interface CartItem {
  productId: number;
  quantity: number;
  metadata?: {
    size?: string;
    color?: string;
  };
}

export interface CreateOrderRequest {
  items: CartItem[];
  email: string;
  shippingAddress?: Address;
  billingAddress?: Address;
}

export interface Address {
  name: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface ShopPaymentIntentRequest {
  items: CartItem[];
  email: string;
}

// ============================================================================
// INVENTORY / CLOSET
// ============================================================================

export interface EquipItemRequest {
  itemId: number;
  slot: 'deck' | 'wheels' | 'trucks' | 'avatar' | null;
}

export interface InventoryFilters {
  itemType?: string;
  rarity?: string;
  equipped?: boolean;
}

// ============================================================================
// SPOTS & CHECK-INS
// ============================================================================

export interface CreateSpotRequest {
  name: string;
  description?: string;
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  spotType?: 'park' | 'street' | 'diy' | 'plaza' | 'indoor';
  difficulty?: 'beginner' | 'intermediate' | 'advanced' | 'pro';
  features?: string[];
}

export interface CheckInRequest {
  spotId: number;
  latitude: number;
  longitude: number;
  photoUrl?: string;
  trickLanded?: string;
  notes?: string;
}

export interface SpotFilters {
  spotType?: string;
  difficulty?: string;
  city?: string;
  verified?: boolean;
  nearLat?: number;
  nearLng?: number;
  radiusKm?: number;
}

// ============================================================================
// S.K.A.T.E. GAME
// ============================================================================

export interface CreateGameRequest {
  maxPlayers?: number;
  isPublic?: boolean;
}

export interface JoinGameRequest {
  gameCode: string;
}

export interface SubmitTrickRequest {
  gameId: number;
  trickName: string;
  videoUrl?: string;
}

export interface RespondToTrickRequest {
  turnId: number;
  videoUrl?: string;
  landed: boolean;
}

export interface GameWithParticipants {
  id: number;
  gameCode: string;
  status: 'waiting' | 'active' | 'completed';
  currentRound: number;
  maxPlayers: number;
  isPublic: boolean;
  createdAt: Date;
  participants: GameParticipantInfo[];
  currentSetter?: UserInfo;
  winner?: UserInfo;
}

export interface GameParticipantInfo {
  userId: number;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  letters: string;
  isEliminated: boolean;
}

export interface UserInfo {
  id: number;
  username?: string;
  displayName?: string;
  avatarUrl?: string;
}

// ============================================================================
// LEADERBOARD
// ============================================================================

export interface LeaderboardFilters {
  type: 'global' | 'weekly' | 'monthly' | 'spot';
  spotId?: number;
  limit?: number;
  offset?: number;
}

export interface LeaderboardUser {
  rank: number;
  userId: number;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  totalPoints: number;
  checkInCount: number;
  gamesWon: number;
}

export interface UserStats {
  userId: number;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  rank: number;
  totalPoints: number;
  checkInCount: number;
  gamesPlayed: number;
  gamesWon: number;
  favoriteSpot?: string;
  lastCheckIn?: Date;
}

// ============================================================================
// API RESPONSES
// ============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
