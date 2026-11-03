import { describe, expect, it } from "vitest";
import dictionaryText from "../../woorden/woordenboek.txt?raw";
import dayWordsText from "../../woorden/woord-van-de-dag.txt?raw";
import {
  alphabetColumns,
  answerForDay,
  betweenGuesses,
  certainPrefix,
  dayNumber,
  findWord,
  firstDay,
  formatDay,
  makeDictionary,
  splitGuesses,
  startsOf,
} from "./game";

const words = ["bal", "kat", "olifant", "pinguïn"];

function possibleLetters(column: { letters: { letter: string; possible: boolean }[] }): string {
  return column.letters.filter(({ possible }) => possible).map(({ letter }) => letter).join("");
}

describe("answerForDay", () => {
  const dayWords = ["aap", "noot", "mies"];

  it("starts at the first line on 1 November 2026", () => {
    expect(answerForDay(dayWords, firstDay)).toBe("aap");
    expect(answerForDay(dayWords, dayNumber(new Date(2026, 10, 2, 23, 0)))).toBe("noot");
  });

  it("starts again after the last day", () => {
    expect(answerForDay(dayWords, firstDay + 3)).toBe("aap");
  });
});

describe("formatDay", () => {
  it("shows the date of a day number", () => {
    expect(formatDay(dayNumber(new Date(2026, 10, 1)))).toBe("1 november");
  });
});

describe("findWord", () => {
  it("finds the list word, ignoring case and accents", () => {
    expect(findWord(makeDictionary(words), "Kat")).toBe("kat");
    expect(findWord(makeDictionary(words), "pinguin")).toBe("pinguïn");
    expect(findWord(makeDictionary(words), "pinguïn")).toBe("pinguïn");
  });

  it("does not guess what an unknown word could be", () => {
    expect(findWord(makeDictionary(words), "olifnat")).toBeUndefined();
  });
});

describe("splitGuesses", () => {
  it("sorts guesses before and after the answer", () => {
    expect(splitGuesses(["zee", "bal", "kat", "olifant"], "konijn")).toEqual({
      before: ["bal", "kat"],
      after: ["olifant", "zee"],
    });
  });
});

describe("betweenGuesses", () => {
  const canStart = betweenGuesses("kat", "kop");

  it("allows any prefix of a word between the guesses, even if it is not a real word", () => {
    expect(canStart("k")).toBe(true);
    expect(canStart("kaz")).toBe(true);
    expect(canStart("koe")).toBe(true);
    expect(canStart("kat")).toBe(true); // kater comes after kat
  });

  it("rejects prefixes of words outside the guesses", () => {
    expect(canStart("j")).toBe(false);
    expect(canStart("kaa")).toBe(false);
    expect(canStart("kop")).toBe(false); // kop itself and everything after it
    expect(canStart("l")).toBe(false);
  });

  it("allows everything without guesses", () => {
    expect(betweenGuesses()("xyz")).toBe(true);
  });
});

describe("alphabetColumns", () => {
  it("shows one unshifted alphabet while the first letter is unknown", () => {
    const columns = alphabetColumns(betweenGuesses("bal", "kat"));
    expect(columns).toHaveLength(1);
    expect(columns[0].shift).toBe(0);
    expect(possibleLetters(columns[0])).toBe("bcdefghijk");
  });

  it("adds an alphabet for every certain letter and lines them up", () => {
    const columns = alphabetColumns(betweenGuesses("koe", "kop"));
    expect(columns.map(possibleLetters)).toEqual(["k", "o", "efghijklmno"]);
    expect(columns[0].shift - columns[1].shift).toBe("o".charCodeAt(0) - "k".charCodeAt(0));
  });

  it("only shows the letters of the word once it is guessed", () => {
    expect(alphabetColumns(startsOf("kat")).map(possibleLetters)).toEqual(["k", "a", "t"]);
    expect(alphabetColumns(startsOf("angst")).map(possibleLetters)).toEqual(["a", "n", "g", "s", "t"]);
  });

  it("stops at six alphabets", () => {
    expect(alphabetColumns(startsOf("dobbelsteen"))).toHaveLength(6);
  });
});

describe("certainPrefix", () => {
  it("returns the letters that are certain", () => {
    expect(certainPrefix(betweenGuesses("koe", "kop"))).toBe("ko");
    expect(certainPrefix(betweenGuesses("kat", "kau"))).toBe("kat");
    expect(certainPrefix(startsOf("pinguïn"))).toBe("pinguin");
  });

  it("is empty when the first letter is not certain", () => {
    expect(certainPrefix(betweenGuesses("bal", "kat"))).toBe("");
    expect(certainPrefix(betweenGuesses())).toBe("");
  });
});

describe("woord-van-de-dag.txt", () => {
  const dayWords = dayWordsText.split("\n").filter(Boolean);

  it("has every word only once", () => {
    expect(dayWords.filter((word, index) => dayWords.indexOf(word) !== index)).toEqual([]);
  });

  it("only has lowercase words without spaces", () => {
    expect(dayWords.filter(word => !/^[a-zà-ÿ]+$/.test(word))).toEqual([]);
  });
});

describe("woordenboek.txt", () => {
  it("contains all secret words (run woorden/create_wordlist.py after adding them)", () => {
    const dictionary = new Set(dictionaryText.split("\n"));
    expect(dayWordsText.split("\n").filter(word => word && !dictionary.has(word))).toEqual([]);
  });
});
