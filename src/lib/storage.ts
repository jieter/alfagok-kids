const storageKey = "alfagok-kinderen";

// Only today's guesses are kept; storage may be unavailable (e.g. private windows).
export function saveGuesses(day: number, guesses: string[]): void {
  try {
    localStorage.setItem(storageKey, JSON.stringify({ day, guesses }));
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
