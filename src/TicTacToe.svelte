<script lang="ts">
  import { confetti } from "./lib/confetti";
  import { loadLevel, saveLevel } from "./lib/storage";
  import {
    computerMove,
    emptyBoard,
    isOver,
    other,
    winner,
    winningLine,
    type Board,
    type Level,
    type Player,
  } from "./lib/tictactoe";

  // the player is always X, the computer O
  const you: Player = "X";
  const computer: Player = "O";
  const levels: Level[] = ["makkelijk", "gemiddeld", "moeilijk"];
  const boardCount = 4;
  // time before the computer plays, so you can see it happen
  const thinkingTime = 500;

  interface Game {
    cells: Board;
    starter: Player;
    turn: Player;
  }

  const savedLevel = loadLevel();
  let level: Level = $state(levels.find(option => option === savedLevel) ?? "gemiddeld");
  let won = $state(0);
  let drawn = $state(0);
  let lost = $state(0);
  let boards: HTMLElement | undefined = $state();
  // half of the boards start with the computer; the starting player swaps each new game
  let games: Game[] = $state(
    Array.from({ length: boardCount }, (_, index) => {
      const starter = index % 2 ? computer : you;
      return { cells: emptyBoard(), starter, turn: starter };
    }),
  );

  function computerTurn(game: Game) {
    setTimeout(() => play(game, computerMove(game.cells, computer, level), computer), thinkingTime);
  }

  function play(game: Game, index: number, player: Player) {
    game.cells[index] = player;
    game.turn = other(player);
    if (isOver(game.cells)) {
      const result = winner(game.cells);
      if (result === you) won++;
      // all boards won at the same time
      if (result === you && boards && games.every(board => winner(board.cells) === you)) confetti(boards);
      if (result === computer) lost++;
      if (!result) drawn++;
    } else if (game.turn === computer) {
      computerTurn(game);
    }
  }

  const allOver = $derived(games.every(game => isOver(game.cells)));

  function chooseLevel(option: Level) {
    level = option;
    saveLevel(option);
  }

  // a new game on every board
  function restart() {
    for (const game of games) {
      game.cells = emptyBoard();
      game.starter = other(game.starter);
      game.turn = game.starter;
      if (game.turn === computer) computerTurn(game);
    }
  }

  for (const game of games) {
    if (game.turn === computer) computerTurn(game);
  }

  function status(game: Game): string {
    const result = winner(game.cells);
    if (result === you) return "Gewonnen!";
    if (result === computer) return "Verloren";
    if (isOver(game.cells)) return "Gelijkspel";
    return game.turn === you ? "Jij bent aan de beurt" : "De computer denkt na...";
  }
</script>

<main>
  <header>
    <h1>
      <span class="mascot" aria-hidden="true">🧈</span>Boter, <span class="mascot" aria-hidden="true">🧀</span>kaas en
      <span class="mascot" aria-hidden="true">🥚</span>eieren
    </h1>
    <p class="score" role="status" aria-live="polite">
      <span class="won">Gewonnen: {won}</span>
      <span class="drawn">Gelijkspel: {drawn}</span>
      <span class="lost">Verloren: {lost}</span>
    </p>
    <div class="levels" role="radiogroup" aria-label="Niveau">
      {#each levels as option (option)}
        <button type="button" role="radio" aria-checked={level === option} onclick={() => chooseLevel(option)}>
          {option}
        </button>
      {/each}
    </div>
    <p class="intro">Jij bent ✕, de computer is ◯.</p>
  </header>

  <div class="boards" bind:this={boards}>
    {#each games as game, gameIndex (gameIndex)}
      {@const line = winningLine(game.cells)}
      {@const over = isOver(game.cells)}
      <section class="game" aria-label="Bord {gameIndex + 1}">
        <div class="board">
          {#each game.cells as cell, index (index)}
            <button
              type="button"
              class="cell"
              class:winning={line?.includes(index) && game.cells[index] === you}
              class:losing={line?.includes(index) && game.cells[index] === computer}
              disabled={over || cell !== null || game.turn !== you}
              aria-label={cell === "X" ? "kruisje" : cell === "O" ? "rondje" : `vakje ${index + 1}`}
              onclick={() => play(game, index, you)}>
              {cell === "X" ? "✕" : cell === "O" ? "◯" : ""}
            </button>
          {/each}
        </div>
        <p class="status">{status(game)}</p>
      </section>
    {/each}
    {#if allOver}
      <button type="button" class="again" onclick={restart}>Nog een keer</button>
    {/if}
  </div>
</main>

<p class="back"><a href="../">Naar Alfagok kids</a></p>

<style>
  main {
    width: min(100%, 720px);
    margin: 0 auto;
    padding: 30px;
    border: 3px solid #23324d;
    border-radius: 28px;
    background: #fff;
    box-shadow: 8px 8px 0 #23324d;
  }

  header {
    text-align: center;
  }

  .mascot {
    margin-right: 0.2em;
  }

  h1 {
    margin: 0 0 10px;
    color: #e85d45;
    font-size: clamp(1.7rem, 7vw, 2.6rem);
    letter-spacing: -1px;
  }

  .score {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 10px;
    margin: 0 0 10px;
    font-weight: 700;
  }

  .score span {
    padding: 7px 13px;
    border-radius: 999px;
  }

  .won {
    background: #e9f4e5;
  }

  .drawn {
    background: #f1f5ff;
  }

  .lost {
    background: #ffe3de;
  }

  .levels {
    display: inline-flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 6px;
  }

  button {
    padding: 8px 14px;
    border: 3px solid #23324d;
    border-radius: 14px;
    background: #fff;
    color: #23324d;
    font: inherit;
    font-weight: 800;
    cursor: pointer;
  }

  button:focus-visible {
    outline: 4px solid #ffbf47;
    outline-offset: 3px;
  }

  .levels button {
    text-transform: capitalize;
  }

  .levels button[aria-checked="true"],
  .again {
    background: #ffbf47;
  }

  .intro {
    margin: 10px 0 16px;
    font-size: 1.05rem;
  }

  .boards {
    position: relative;
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 24px 16px;
  }

  .game {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  /* the dark board shows through the gaps between the cells as two vertical and two horizontal lines */
  .board {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 4px;
    width: min(100%, 200px);
    background: #23324d;
  }

  .cell {
    aspect-ratio: 1;
    padding: 0;
    border: none;
    border-radius: 0;
    background: #fff;
    font-size: clamp(1.4rem, 7vw, 2rem);
    line-height: 1;
  }

  .cell:disabled {
    cursor: default;
  }

  .cell:not(:disabled):hover {
    background: #fff2ce;
  }

  .cell.winning {
    background: #e9f4e5;
  }

  .cell.losing {
    background: #ffe3de;
  }

  .status {
    min-height: 1.5em;
    margin: 6px 0 0;
    font-size: 0.9rem;
    color: #53617a;
    font-weight: 700;
  }

  /* in the middle, between the four boards */
  .again {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    box-shadow: 3px 3px 0 #23324d;
  }

  .back {
    margin: 24px auto 0;
    text-align: center;
  }

  .back a {
    color: #23324d;
    font-weight: 700;
  }

  /* compact on phones: the header on as few lines as possible and a small button between the boards */
  @media (max-width: 420px) {
    main {
      padding: 20px 14px;
      box-shadow: 5px 5px 0 #23324d;
    }

    .mascot {
      display: none;
    }

    .score {
      gap: 4px;
      font-size: 0.8rem;
    }

    .score span {
      padding: 4px 8px;
    }

    .levels button,
    .again {
      padding: 5px 10px;
      font-size: 0.9rem;
    }

    .intro {
      font-size: 0.95rem;
    }

    .boards {
      row-gap: 32px;
    }
  }
</style>
