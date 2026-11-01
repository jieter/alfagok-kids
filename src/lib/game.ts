export const collator = new Intl.Collator("nl-NL", { sensitivity: "base" });

export const alphabet = "abcdefghijklmnopqrstuvwxyz";

// One word per line; empty lines are ignored.
export function parseWords(text: string): string[] {
  const words = [...new Set(text.split("\n").map(word => word.trim()).filter(Boolean))];
  return words.sort(collator.compare);
}

export function dayNumber(date: Date): number {
  return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000);
}

// e.g. "1 november", for a day number from dayNumber()
export function formatDay(day: number): string {
  return new Date(day * 86400000).toLocaleDateString("nl-NL", { day: "numeric", month: "long", timeZone: "UTC" });
}

export function answerForDay(words: string[], day: number): string {
  return words[((day % words.length) + words.length) % words.length];
}

// The list word matching the typed text, ignoring case and accents.
export function findWord(words: string[], typed: string): string | undefined {
  return words.find(word => collator.compare(word, typed) === 0);
}

// The guesses that come before and after the answer, both sorted alphabetically.
export function splitGuesses(guesses: string[], answer: string): { before: string[]; after: string[] } {
  const sorted = [...guesses].sort(collator.compare);
  return {
    before: sorted.filter(word => collator.compare(word, answer) < 0),
    after: sorted.filter(word => collator.compare(word, answer) > 0),
  };
}

// The list words that can still be the answer: strictly between the closest guesses.
export function candidatesBetween(words: string[], lowest?: string, highest?: string): string[] {
  return words.filter(word =>
    (!lowest || collator.compare(word, lowest) > 0) && (!highest || collator.compare(word, highest) < 0)
  );
}

export interface AlphabetColumn {
  letters: { letter: string; possible: boolean }[];
  // number of rows to move the column down
  shift: number;
}

function sameLetterAt(candidates: string[], position: number): boolean {
  return candidates.every(word =>
    word[position] !== undefined && collator.compare(word[position], candidates[0][position]) === 0
  );
}

// The letters all candidates start with, so these are certain.
export function commonPrefix(candidates: string[]): string {
  if (candidates.length === 0) return "";
  let length = 0;
  while (sameLetterAt(candidates, length)) length++;
  return candidates[0].slice(0, length);
}

// An alphabet for the next letter is added as long as all previous letters are certain,
// up to maxColumns letters. The columns are shifted so the certain letters form a row in
// the middle, with the possible letters of the last column centered on it.
export function alphabetColumns(candidates: string[], maxColumns = 6): AlphabetColumn[] {
  const columns: AlphabetColumn[] = [];
  let position = 0;
  while (true) {
    columns.push({
      letters: [...alphabet].map(letter => ({
        letter,
        possible: candidates.some(word => collator.compare(word[position] ?? "", letter) === 0),
      })),
      shift: 0,
    });
    if (position >= maxColumns - 1 || !sameLetterAt(candidates, position)) break;
    // no alphabet for a letter that none of the words have
    if (candidates.every(word => word.length <= position + 1)) break;
    position++;
  }

  if (columns.length > 1) {
    const middle = 12.5;
    for (const column of columns) {
      const possible = column.letters.flatMap(({ possible }, index) => (possible ? [index] : []));
      const focus = possible.length ? Math.round(possible.reduce((a, b) => a + b) / possible.length) : middle;
      column.shift = middle - focus;
    }
  }
  return columns;
}
