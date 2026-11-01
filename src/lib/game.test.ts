import { describe, expect, it } from "vitest";
import wordsText from "../../woorden.txt?raw";
import {
  alphabetColumns,
  answerForDay,
  candidatesBetween,
  closestWord,
  dayNumber,
  editDistance,
  parseWords,
  splitGuesses,
} from "./game";

const words = parseWords("olifant\nkat\nkop\nkoe\nkoekje\nkonijn\nkwal\nzee\nzeef\n\npinguïn\nbal\nbad\n");

function possibleLetters(column: { letters: { letter: string; possible: boolean }[] }): string {
  return column.letters.filter(({ possible }) => possible).map(({ letter }) => letter).join("");
}

describe("parseWords", () => {
  it("sorts, trims and skips empty lines and duplicates", () => {
    expect(parseWords(" zon\n\naap\nzon\n")).toEqual(["aap", "zon"]);
  });
});

describe("answerForDay", () => {
  it("is the same for the whole day", () => {
    const morning = dayNumber(new Date(2026, 10, 1, 7, 0));
    const evening = dayNumber(new Date(2026, 10, 1, 23, 0));
    expect(answerForDay(words, morning)).toBe(answerForDay(words, evening));
  });

  it("changes the next day", () => {
    const day = dayNumber(new Date(2026, 10, 1));
    expect(answerForDay(words, day + 1)).not.toBe(answerForDay(words, day));
  });
});

describe("editDistance", () => {
  it("counts swapped letters as two edits", () => {
    expect(editDistance("olifnat", "olifant")).toBe(2);
  });
});

describe("closestWord", () => {
  it("returns the word itself, ignoring case and accents", () => {
    expect(closestWord(words, "Kat")).toBe("kat");
    expect(closestWord(words, "pinguin")).toBe("pinguïn");
  });

  it("fixes typos", () => {
    expect(closestWord(words, "olifnat")).toBe("olifant");
  });

  it("uses the next word with the same first letter for unknown words", () => {
    expect(closestWord(words, "kaars")).toBe("kat");
    expect(closestWord(words, "zzzzzz")).toBe("zeef");
  });

  it("keeps the first letter", () => {
    expect(closestWord(words, "xylofoon")).toBeUndefined();
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

describe("alphabetColumns", () => {
  it("shows one unshifted alphabet while the first letter is unknown", () => {
    const columns = alphabetColumns(words);
    expect(columns).toHaveLength(1);
    expect(columns[0].shift).toBe(0);
    expect(possibleLetters(columns[0])).toBe("bkopz");
  });

  it("adds an alphabet for every certain letter and lines them up", () => {
    const columns = alphabetColumns(candidatesBetween(words, "koe", "kop"));
    expect(columns.map(possibleLetters)).toEqual(["k", "o", "en"]);
    expect(columns[0].shift - columns[1].shift).toBe("o".charCodeAt(0) - "k".charCodeAt(0));
  });

  it("stops adding alphabets after the letter where a candidate word can end", () => {
    expect(alphabetColumns(["zee", "zeef"]).map(possibleLetters)).toEqual(["z", "e", "e", "f"]);
  });

  it("stops at six alphabets", () => {
    expect(alphabetColumns(["dobbelsteen"])).toHaveLength(6);
  });
});

describe("woorden.txt", () => {
  const list = wordsText.split("\n").filter(Boolean);

  it("has no duplicates", () => {
    expect(new Set(list).size).toBe(list.length);
  });

  it("only has lowercase words without spaces", () => {
    expect(list.filter(word => !/^[a-zà-ÿ]+$/.test(word))).toEqual([]);
  });
});
