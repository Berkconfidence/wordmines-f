export interface LetterInfo {
  letter: string;
  count: number;
  points: number;
}

export const LETTER_DISTRIBUTION: LetterInfo[] = [
  { letter: 'A', count: 12, points: 1 },
  { letter: 'B', count: 2, points: 3 },
  { letter: 'C', count: 2, points: 4 },
  { letter: 'Ç', count: 2, points: 4 },
  { letter: 'D', count: 2, points: 3 },
  { letter: 'E', count: 8, points: 1 },
  { letter: 'F', count: 1, points: 7 },
  { letter: 'G', count: 1, points: 5 },
  { letter: 'Ğ', count: 1, points: 8 },
  { letter: 'H', count: 1, points: 5 },
  { letter: 'I', count: 4, points: 2 },
  { letter: 'İ', count: 7, points: 1 },
  { letter: 'J', count: 1, points: 10 },
  { letter: 'K', count: 7, points: 1 },
  { letter: 'L', count: 7, points: 1 },
  { letter: 'M', count: 4, points: 2 },
  { letter: 'N', count: 5, points: 1 },
  { letter: 'Ö', count: 1, points: 7 },
  { letter: 'P', count: 1, points: 5 },
  { letter: 'R', count: 6, points: 1 },
  { letter: 'S', count: 3, points: 2 },
  { letter: 'Ş', count: 2, points: 4 },
  { letter: 'T', count: 5, points: 1 },
  { letter: 'U', count: 3, points: 2 },
  { letter: 'Ü', count: 2, points: 3 },
  { letter: 'V', count: 1, points: 7 },
  { letter: 'Y', count: 2, points: 3 },
  { letter: 'Z', count: 2, points: 4 },
  { letter: 'JOKER', count: 2, points: 0 },
];

export function getRandomLetters(count: number = 7): { letter: string; points: number }[] {
  // Create a pool of letters based on their distribution
  const letterPool: { letter: string; points: number }[] = [];
  
  LETTER_DISTRIBUTION.forEach((item) => {
    for (let i = 0; i < item.count; i++) {
      letterPool.push({ letter: item.letter, points: item.points });
    }
  });
  
  // Shuffle and select random letters
  const shuffled = [...letterPool].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}
