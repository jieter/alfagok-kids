const storageKey = "alfagok-kinderen";

// Only today's guesses are kept; storage may be unavailable (e.g. private windows).
export function saveGuesses(day: number, guesses: string[]): void {
  try {
    localStorage.setItem(storageKey, JSON.stringify({ day, guesses }));
  } catch {}
}

export function clearGuesses(): void {
  try {
    localStorage.removeItem(storageKey);
  } catch {}
}

export function loadGuesses(day: number): string[] {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) ?? "null");
    return saved && saved.day === day && Array.isArray(saved.guesses) ? saved.guesses : [];
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
