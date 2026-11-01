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

export function answerForDay(words: string[], day: number): string {
  return words[((day % words.length) + words.length) % words.length];
}

export function editDistance(a: string, b: string): number {
  let previous = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const current = [i];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      current[j] = Math.min(previous[j] + 1, current[j - 1] + 1, previous[j - 1] + cost);
    }
    previous = current;
  }
  return previous[b.length];
}

// Typos (at most 2 letters off) map to the closest spelling, anything else
// to the list word that follows it alphabetically. The first letter is kept,
// so this returns undefined if no list word starts with the typed letter.
export function closestWord(words: string[], typed: string): string | undefined {
  const exact = words.find(word => collator.compare(word, typed) === 0);
  if (exact) return exact;

  const candidates = words.filter(word => collator.compare(word[0], typed[0]) === 0);
  if (candidates.length === 0) return undefined;

  const lower = typed.toLocaleLowerCase("nl-NL");
  let best = candidates[0];
  let bestDistance = Infinity;
  for (const word of candidates) {
    const distance = editDistance(lower, word);
    if (distance < bestDistance) {
      best = word;
      bestDistance = distance;
    }
  }
  if (bestDistance <= 2) return best;

  return candidates.find(word => collator.compare(word, typed) > 0) ?? candidates[candidates.length - 1];
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
