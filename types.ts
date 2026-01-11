export enum GamePhase {
  HOME = 'HOME',
  SETUP = 'SETUP',
  LOADING = 'LOADING',
  DISTRIBUTE = 'DISTRIBUTE',
  REVEAL = 'REVEAL',
  ROULETTE = 'ROULETTE',
  PLAYING = 'PLAYING',
  VOTING = 'VOTING',
  ROUND_RESULT = 'ROUND_RESULT',
  GAME_OVER = 'GAME_OVER'
}

export interface Player {
  id: string;
  name: string;
  isImposter: boolean;
  isDead?: boolean;
  avatar: string;
}

export interface GameScenario {
  location: string;
  category: string;
  hint: string;
}