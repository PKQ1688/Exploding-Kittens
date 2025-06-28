// 从前端复制的游戏类型
export const CardType = {
  EXPLODING_KITTEN: 'exploding_kitten',
  DEFUSE: 'defuse',
  NOPE: 'nope',
  ATTACK: 'attack',
  SKIP: 'skip',
  FAVOR: 'favor',
  SHUFFLE: 'shuffle',
  SEE_THE_FUTURE: 'see_the_future',
  CAT_TACOCAT: 'cat_tacocat',
  CAT_CATTERMELON: 'cat_cattermelon',
  CAT_HAIRY_POTATO: 'cat_hairy_potato',
  CAT_RAINBOW_RALPHING: 'cat_rainbow_ralphing',
  CAT_BEARD: 'cat_beard'
} as const;

export type CardType = typeof CardType[keyof typeof CardType];

export const GamePhase = {
  SETUP: 'setup',
  WAITING: 'waiting',
  PLAYING: 'playing',
  GAME_OVER: 'game_over'
} as const;

export type GamePhase = typeof GamePhase[keyof typeof GamePhase];

export interface Card {
  id: string;
  type: CardType;
  name: string;
  description: string;
  count: number;
}

export interface Player {
  id: string;
  name: string;
  socketId: string;
  hand: Card[];
  isAlive: boolean;
  isCurrentPlayer: boolean;
  isReady: boolean;
}

export interface GameState {
  phase: GamePhase;
  players: Player[];
  currentPlayerIndex: number;
  drawPile: Card[];
  discardPile: Card[];
  winner: Player | null;
  turnCount: number;
  attackTurnsRemaining: number;
  lastAction: string;
}

export interface Room {
  id: string;
  name: string;
  players: Player[];
  gameState: GameState | null;
  maxPlayers: number;
  isGameStarted: boolean;
  createdAt: Date;
}

// WebSocket 事件类型
export interface ServerToClientEvents {
  room_list: (rooms: Room[]) => void;
  room_joined: (room: Room) => void;
  room_left: () => void;
  player_joined: (player: Player) => void;
  player_left: (playerId: string) => void;
  player_ready: (playerId: string, isReady: boolean) => void;
  game_started: (gameState: GameState) => void;
  game_state_update: (gameState: GameState) => void;
  error: (message: string) => void;
  card_played: (playerId: string, cardId: string, targetPlayerId?: string) => void;
  card_drawn: (playerId: string) => void;
  turn_ended: (playerId: string) => void;
}

export interface ClientToServerEvents {
  create_room: (roomName: string, playerName: string) => void;
  join_room: (roomId: string, playerName: string) => void;
  leave_room: () => void;
  get_rooms: () => void;
  player_ready: (isReady: boolean) => void;
  start_game: () => void;
  play_card: (cardId: string, targetPlayerId?: string) => void;
  draw_card: () => void;
  end_turn: () => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  playerId?: string;
  roomId?: string;
}
