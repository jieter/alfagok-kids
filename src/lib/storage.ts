// The guesses for the daily word and for a word chosen by someone else are kept apart.
export const dailyKey = "alfagok-kinderen";
export const chosenKey = "alfagok-kinderen-gekozen";

// Only the current game is kept: today, or the code of the chosen word. Storage may be unavailable
// (e.g. private windows).
export function saveGuesses(key: string, game: number | string, guesses: string[]): void {
  try {
    localStorage.setItem(key, JSON.stringify({ game, guesses }));
  } catch {}
}

export function clearGuesses(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {}
}

export function loadGuesses(key: string, game: number | string): string[] {
  try {
    const saved = JSON.parse(localStorage.getItem(key) ?? "null");
    return saved && saved.game === game && Array.isArray(saved.guesses) ? saved.guesses : [];
  } catch {
    return [];
  }
}

const historyKey = "alfagok-kinderen-geschiedenis";

export interface Solved {
  day: number;
  word: string;
  attempts: number;
}

// Solved words of earlier days and today, newest first.
export function loadHistory(): Solved[] {
  try {
    const saved = JSON.parse(localStorage.getItem(historyKey) ?? "[]");
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

// Stores the solved word for a day, replacing an earlier entry for that day.
export function saveSolved(solved: Solved): Solved[] {
  const history = [solved, ...loadHistory().filter(entry => entry.day !== solved.day)].sort((a, b) => b.day - a.day);
  try {
    localStorage.setItem(historyKey, JSON.stringify(history));
  } catch {}
  return history;
}
