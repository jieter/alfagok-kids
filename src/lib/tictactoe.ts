export type Player = "X" | "O";
export type Cell = Player | null;
export type Board = Cell[];
export type Level = "makkelijk" | "gemiddeld" | "moeilijk";

export const lines = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

export function emptyBoard(): Board {
  return Array(9).fill(null);
}

export function other(player: Player): Player {
  return player === "X" ? "O" : "X";
}

// The three cells of the line a player completed, if any.
export function winningLine(board: Board): number[] | undefined {
  return lines.find(([a, b, c]) => board[a] && board[a] === board[b] && board[a] === board[c]);
}

export function winner(board: Board): Player | undefined {
  const line = winningLine(board);
  return line ? (board[line[0]] as Player) : undefined;
}

export function freeCells(board: Board): number[] {
  return board.flatMap((cell, index) => (cell ? [] : [index]));
}

export function isOver(board: Board): boolean {
  return winner(board) !== undefined || freeCells(board).length === 0;
}

function pick<T>(items: T[], random: () => number): T {
  return items[Math.floor(random() * items.length)];
}

// A free cell that completes a line for the player, if there is one.
function completingCell(board: Board, player: Player): number | undefined {
  return freeCells(board).find(index => {
    const next = [...board];
    next[index] = player;
    return winner(next) === player;
  });
}

// Score of the board for `me` with `turn` to move: positive is a win, negative a loss; quicker wins score higher.
function minimax(board: Board, turn: Player, me: Player): number {
  const won = winner(board);
  const free = freeCells(board);
  if (won) return (won === me ? 1 : -1) * (free.length + 1);
  if (free.length === 0) return 0;
  const scores = free.map(index => {
    const next = [...board];
    next[index] = turn;
    return minimax(next, other(turn), me);
  });
  return turn === me ? Math.max(...scores) : Math.min(...scores);
}

// The cell the computer plays as `me`:
// - makkelijk: a random free cell
// - gemiddeld: wins or blocks when it can, otherwise a random free cell
// - moeilijk: a best move, so it never loses
export function computerMove(board: Board, me: Player, level: Level, random: () => number = Math.random): number {
  const free = freeCells(board);
  if (level === "makkelijk") return pick(free, random);
  if (level === "gemiddeld") return completingCell(board, me) ?? completingCell(board, other(me)) ?? pick(free, random);

  const scored = free.map(index => {
    const next = [...board];
    next[index] = me;
    return { index, score: minimax(next, other(me), me) };
  });
  const best = Math.max(...scored.map(({ score }) => score));
  return pick(
    scored.filter(({ score }) => score === best).map(({ index }) => index),
    random,
  );
}
