import { describe, expect, it } from "vitest";
import { computerMove, emptyBoard, freeCells, isOver, other, winner, type Board, type Player } from "./tictactoe";

function board(text: string): Board {
  return [...text].map(char => (char === "X" || char === "O" ? char : null));
}

describe("winner", () => {
  it("finds rows, columns and diagonals", () => {
    expect(winner(board("XXX......"))).toBe("X");
    expect(winner(board(".O..O..O."))).toBe("O");
    expect(winner(board("..X.X.X.."))).toBe("X");
  });

  it("is undefined without a line", () => {
    expect(winner(emptyBoard())).toBeUndefined();
    expect(winner(board("XOXXOOOXX"))).toBeUndefined();
    expect(isOver(board("XOXXOOOXX"))).toBe(true);
  });
});

describe("computerMove", () => {
  it("plays a free cell on every level", () => {
    for (const level of ["makkelijk", "gemiddeld", "moeilijk"] as const) {
      expect(freeCells(board("XOXOXO.XO"))).toContain(computerMove(board("XOXOXO.XO"), "X", level));
    }
  });

  it("wins when it can on gemiddeld and moeilijk", () => {
    expect(computerMove(board("OO.XX...."), "O", "gemiddeld")).toBe(2);
    expect(computerMove(board("OO.XX...."), "O", "moeilijk")).toBe(2);
  });

  it("blocks on gemiddeld", () => {
    expect(computerMove(board("XX..O...."), "O", "gemiddeld")).toBe(2);
  });

  // plays every possible game against moeilijk
  function canBeat(position: Board, turn: Player, computer: Player): boolean {
    if (isOver(position)) return winner(position) === other(computer);
    if (turn === computer) {
      const next = [...position];
      next[computerMove(position, computer, "moeilijk", () => 0)] = computer;
      return canBeat(next, other(turn), computer);
    }
    return freeCells(position).some(index => {
      const next = [...position];
      next[index] = turn;
      return canBeat(next, other(turn), computer);
    });
  }

  it("never loses on moeilijk", () => {
    expect(canBeat(emptyBoard(), "X", "O")).toBe(false);
    expect(canBeat(emptyBoard(), "O", "O")).toBe(false);
  });
});
