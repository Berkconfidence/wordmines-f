// Hücre veri tipi tanımı
export type CellData = {
  type: 'normal' | 'mine' | 'reward';
  letter?: string;
  multiplier?: string;
};

// Oyun hamle tipi
export type GameMove = {
  position: {
    row: number;
    col: number;
  };
  letter: string;
  playerId?: string;
};

// Oyun odası tipi
export type GameRoom = {
  roomId: string;
  players: string[];
  currentTurn: string;
  board: CellData[][];
  moves: GameMove[];
};
