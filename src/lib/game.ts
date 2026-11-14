export const collator = new Intl.Collator("nl-NL", { sensitivity: "base" });

export const alphabet = "abcdefghijklmnopqrstuvwxyz";

export function dayNumber(date: Date): number {
  return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000);
}

// e.g. "1 november", for a day number from dayNumber()
export function formatDay(day: number): string {
  return new Date(day * 86400000).toLocaleDateString("nl-NL", { day: "numeric", month: "long", timeZone: "UTC" });
}

// The first line of woord-van-de-dag.txt is the word for 1 November 2026.
export const firstDay = dayNumber(new Date(2026, 10, 1));

// After the last day the list starts again from the top.
export function answerForDay(dayWords: string[], day: number): string {
  const index = day - firstDay;
  return dayWords[((index % dayWords.length) + dayWords.length) % dayWords.length];
}

function withoutAccents(word: string): string {
  return word.normalize("NFD").replace(/\p{M}/gu, "");
}

// Fast lookup in a big word list; words with accents can also be found without them.
export interface Dictionary {
  words: Set<string>;
  withoutAccents: Map<string, string>;
}

export function makeDictionary(words: Iterable<string>): Dictionary {
  const dictionary: Dictionary = { words: new Set(), withoutAccents: new Map() };
  for (const word of words) {
    dictionary.words.add(word);
    // only a few words have accents, so this check keeps building the dictionary quick
    if (/[^a-z]/.test(word)) dictionary.withoutAccents.set(withoutAccents(word), word);
  }
  return dictionary;
}

// The dictionary word matching the typed text, ignoring case and accents.
export function findWord(dictionary: Dictionary, typed: string): string | undefined {
  const lower = typed.trim().toLocaleLowerCase("nl-NL");
  if (dictionary.words.has(lower)) return lower;
  return dictionary.withoutAccents.get(withoutAccents(lower));
}

// The guesses that come before and after the answer, both sorted alphabetically.
export function splitGuesses(guesses: string[], answer: string): { before: string[]; after: string[] } {
  const sorted = [...guesses].sort(collator.compare);
  return {
    before: sorted.filter(word => collator.compare(word, answer) < 0),
    after: sorted.filter(word => collator.compare(word, answer) > 0),
  };
}

// Tells whether some word starting with this prefix could still be the answer.
export type CanStart = (prefix: string) => boolean;

// Words strictly between the closest guesses, whether or not they are in a word list.
export function betweenGuesses(lowest?: string, highest?: string): CanStart {
  return prefix => {
    const length = prefix.length;
    // all words with this prefix come before the lowest guess
    if (lowest && collator.compare(lowest.slice(0, length), prefix) > 0) return false;
    if (highest) {
      const order = collator.compare(highest.slice(0, length), prefix);
      // all words with this prefix come after the highest guess (or are it)
      if (order < 0 || (order === 0 && highest.length <= length)) return false;
    }
    return true;
  };
}

// Only the given word, once it has been guessed.
export function startsOf(word: string): CanStart {
  return prefix => collator.compare(word.slice(0, prefix.length), prefix) === 0;
}

function possibleLetters(canStart: CanStart, prefix: string): string[] {
  return [...alphabet].filter(letter => canStart(prefix + letter));
}

export interface AlphabetColumn {
  letters: { letter: string; possible: boolean }[];
  // number of rows to move the column down
  shift: number;
}

// An alphabet for the next letter is added as long as all previous letters are certain,
// up to maxColumns letters. The columns are shifted so the certain letters form a row in
// the middle, with the possible letters of the last column centered on it.
export function alphabetColumns(canStart: CanStart, maxColumns = 6): AlphabetColumn[] {
  const columns: AlphabetColumn[] = [];
  let prefix = "";
  while (columns.length < maxColumns) {
    const possible = possibleLetters(canStart, prefix);
    // no alphabet after the last letter of a guessed word
    if (possible.length === 0) break;
    columns.push({
      letters: [...alphabet].map(letter => ({ letter, possible: possible.includes(letter) })),
      shift: 0,
    });
    if (possible.length !== 1) break;
    prefix += possible[0];
  }

  if (columns.length > 1) {
    const middle = 12.5;
    for (const column of columns) {
      const possible = column.letters.flatMap(({ possible }, index) => (possible ? [index] : []));
      const focus = Math.round(possible.reduce((a, b) => a + b) / possible.length);
      column.shift = middle - focus;
    }
  }
  return columns;
}

// A word chosen by someone else travels in the link, in base64url so it cannot be read at a glance.
export function encodeWord(word: string): string {
  const bytes = new TextEncoder().encode(word);
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

// The word from encodeWord(), or undefined if the code is not a word.
export function decodeWord(code: string): string | undefined {
  try {
    const binary = atob(code.replace(/-/g, "+").replace(/_/g, "/"));
    const word = new TextDecoder("utf-8", { fatal: true }).decode(Uint8Array.from(binary, char => char.charCodeAt(0)));
    return /^\p{L}+$/u.test(word) ? word.toLocaleLowerCase("nl-NL") : undefined;
  } catch {
    return undefined;
  }
}
