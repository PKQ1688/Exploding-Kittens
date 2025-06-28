// 卡牌类型常量
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

// 卡牌接口
export interface Card {
  id: string;
  type: CardType;
  name: string;
  description: string;
  count: number;
}

// 玩家接口
export interface Player {
  id: string;
  name: string;
  hand: Card[];
  isAlive: boolean;
  isCurrentPlayer: boolean;
}

// 游戏阶段常量
export const GamePhase = {
  SETUP: 'setup',
  PLAYING: 'playing',
  GAME_OVER: 'game_over'
} as const;

export type GamePhase = typeof GamePhase[keyof typeof GamePhase];

// 游戏状态接口
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

// 卡牌效果接口
export interface CardEffect {
  type: CardType;
  execute: (gameState: GameState, playerId: string, targetPlayerId?: string) => GameState;
  canPlay: (gameState: GameState, playerId: string) => boolean;
}

// 游戏动作类型
export const ActionType = {
  PLAY_CARD: 'play_card',
  DRAW_CARD: 'draw_card',
  END_TURN: 'end_turn',
  USE_DEFUSE: 'use_defuse',
  PLACE_EXPLODING_KITTEN: 'place_exploding_kitten'
} as const;

export type ActionType = typeof ActionType[keyof typeof ActionType];

// 游戏动作接口
export interface GameAction {
  type: ActionType;
  playerId: string;
  cardId?: string;
  targetPlayerId?: string;
  position?: number;
}
