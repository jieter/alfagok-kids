<script lang="ts">
  import { onMount, tick } from "svelte";
  import wordsText from "../woorden.txt?raw";
  import Alphabets from "./lib/Alphabets.svelte";
  import { confetti } from "./lib/confetti";
  import {
    alphabetColumns,
    answerForDay,
    candidatesBetween,
    collator,
    commonPrefix,
    dayNumber,
    findWord,
    formatDay,
    parseWords,
    splitGuesses,
  } from "./lib/game";
  import {
    clearGuesses,
    loadGuesses,
    loadHistory,
    loadOnlyListWords,
    saveGuesses,
    saveOnlyListWords,
    saveSolved,
  } from "./lib/storage";

  const words = parseWords(wordsText);
  const known = new Set(words);
  const day = dayNumber(new Date());
  const answer = answerForDay(words, day);

  function hint(guess: string): string {
    return collator.compare(guess, answer) < 0
      ? `${guess} komt eerder. Het geheime woord staat dus later!`
      : `${guess} komt later. Het geheime woord staat dus eerder!`;
  }

  // ?clear in the URL forgets today's guesses; it is removed so a reload does not clear again
  const url = new URL(location.href);
  if (url.searchParams.has("clear")) {
    clearGuesses();
    url.searchParams.delete("clear");
    history.replaceState(null, "", url);
  }

  const restored = loadGuesses(day);
  const lastRestored = restored.at(-1);

  let guessed: string[] = $state(restored);
  let latest = $state(lastRestored);
  let typed = $state("");
  let message = $state(lastRestored && lastRestored !== answer ? hint(lastRestored) : "");
  let onlyListWords = $state(loadOnlyListWords());
  let solvedWords = $state(loadHistory());
  let input: HTMLInputElement | undefined = $state();
  let success: HTMLElement | undefined = $state();

  const won = $derived(guessed.includes(answer));
  const split = $derived(splitGuesses(guessed, answer));
  const candidates = $derived(won ? [answer] : candidatesBetween(words, split.before.at(-1), split.after[0]));
  const columns = $derived(alphabetColumns(candidates));

  async function submit(event: SubmitEvent) {
    event.preventDefault();
    const text = typed.trim();
    const listWord = findWord(words, text);
    if (!listWord && onlyListWords) {
      message = `${text} staat niet in mijn woordenlijst. Probeer een ander woord!`;
      input?.select();
      return;
    }
    const guess = listWord ?? text.toLocaleLowerCase("nl-NL");

    if (guessed.some(word => collator.compare(word, guess) === 0)) {
      message = "Dat woord heb je al geprobeerd. Kies een ander woord!";
      input?.select();
      return;
    }

    guessed.push(guess);
    latest = guess;
    // fill in the letters that are already certain
    typed = commonPrefix(candidates);
    saveGuesses(day, $state.snapshot(guessed));
    message = guess === answer ? "" : hint(guess);

    if (guess === answer) {
      solvedWords = saveSolved({ day, word: answer, attempts: guessed.length });
      await tick();
      if (success) confetti(success);
    } else {
      input?.focus();
    }
  }

  onMount(() => {
    if (!won) typed = commonPrefix(candidates);
    // also for games won before the history was kept
    if (won && !solvedWords.some(entry => entry.day === day)) {
      solvedWords = saveSolved({ day, word: answer, attempts: guessed.length });
    }
    if (won && success) confetti(success);
  });
</script>

<Alphabets {columns} />

<main>
  <header>
    <h1><span class="mascot" aria-hidden="true">🦊</span>Alfagok kids<span class="mascot" aria-hidden="true">🦊</span></h1>
    <p class="intro" class:played={guessed.length > 0}>Raad het geheime woord. Staat jouw woord eerder of later in het alfabet?</p>
    <span class="counter">{guessed.length} {guessed.length === 1 ? "poging" : "pogingen"}</span>
  </header>

  <section class="guesses" aria-label="Woorden die voor het geheime woord komen">
    <ul class="guess-list" aria-live="polite">
      {#each split.before as word (word)}
        <li class:just-guessed={word === latest} class:unknown={!known.has(word)}>{word}</li>
      {/each}
    </ul>
    <p class="zone-label">⬆ Eerder in het alfabet</p>
  </section>

  {#if won}
    <p class="success" role="status" bind:this={success}>Hoera! Het geheime woord is {answer}. Goed geraden!</p>
  {:else}
    <form onsubmit={submit}>
      <label for="guess-input" class="visually-hidden">Jouw woord</label>
      <input id="guess-input" name="guess" type="text" bind:this={input} bind:value={typed}
        placeholder="Typ een woord..." autocomplete="off" required>
      <button type="submit">Gok!</button>
    </form>
  {/if}

  <section class="guesses" aria-label="Woorden die na het geheime woord komen">
    <p class="zone-label">⬇ Later in het alfabet</p>
    <ul class="guess-list" aria-live="polite">
      {#each split.after as word (word)}
        <li class:just-guessed={word === latest} class:unknown={!known.has(word)}>{word}</li>
      {/each}
    </ul>
  </section>

  <p class="message" role="status" aria-live="polite">{message}</p>
  <p class="help">
    <strong>Zo speel je:</strong> typ een woord en druk op Gok.
    {#if onlyListWords}
      Ken ik je woord niet, dan mag je een ander woord proberen.
    {:else}
      Ken ik je woord niet, dan wordt het rood.
    {/if}
    Je ziet of het geheime woord eerder of later komt. Blijf raden tot je het vindt!
  </p>
  <label class="setting">
    <input type="checkbox" role="switch" bind:checked={onlyListWords} onchange={() => saveOnlyListWords(onlyListWords)}>
    Alleen woorden uit de woordenlijst
  </label>

  {#if solvedWords.length > 0}
    <section class="history">
      <h2>Eerder geraden</h2>
      <ul>
        {#each solvedWords as entry (entry.day)}
          <li>
            <span class="history-day">{formatDay(entry.day)}</span>
            <strong>{entry.word}</strong>
            <span>{entry.attempts} {entry.attempts === 1 ? "poging" : "pogingen"}</span>
          </li>
        {/each}
      </ul>
    </section>
  {/if}
</main>

<style>
  main {
    position: relative;
    z-index: 1;
    width: min(100%, 560px);
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
    margin-right: .2em;
  }

  h1 {
    margin: 8px 0;
    color: #e85d45;
    font-size: clamp(2rem, 8vw, 3rem);
    letter-spacing: -1px;
  }

  .intro {
    max-height: 6em;
    margin: 0 auto 24px;
    max-width: 390px;
    overflow: hidden;
    font-size: 1.05rem;
    line-height: 1.5;
    transition: opacity 600ms ease-out, max-height 600ms ease-out 300ms, margin 600ms ease-out 300ms;
  }

  /* on small screens, make room once the game has started */
  @media (max-width: 720px) {
    .intro.played {
      max-height: 0;
      margin-bottom: 0;
      opacity: 0;
    }
  }

  .counter {
    display: inline-block;
    margin-bottom: 16px;
    padding: 7px 13px;
    border-radius: 999px;
    background: #e9f4e5;
    font-weight: 700;
  }

  .guesses {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: 6px;
    min-height: 40px;
    margin: 6px 0;
  }

  .guess-list {
    display: contents;
  }

  .guess-list li {
    list-style: none;
    padding: 4px 10px;
    border: 2px solid #dfe6ef;
    border-radius: 12px;
    background: #f7f9fc;
    font-size: 1.1rem;
    font-weight: 700;
  }

  .guess-list li.just-guessed {
    border-color: #ffbf47;
    background: #fff2ce;
    animation: pop 220ms ease-out;
  }

  /* wavy border: rounded corners and one wave per edge tile, repeated along the sides */
  .guess-list li.unknown {
    border-color: #8b1a1a;
    background: #fdf3f3;
    color: #8b1a1a;
  }

  @keyframes pop {
    from { transform: scale(.85); }
    to { transform: scale(1); }
  }

  .zone-label {
    margin: 0;
    color: #53617a;
    font-size: .88rem;
    font-weight: 700;
    text-align: center;
  }

  form {
    display: flex;
    gap: 8px;
    margin: 12px 0;
  }

  .success {
    margin: 12px 0;
    padding: 13px 15px;
    border: 3px solid #23324d;
    border-radius: 14px;
    background: #2b8a4e;
    color: #fff;
    font-size: 1.1rem;
    font-weight: 800;
    text-align: center;
  }

  input[type="text"] {
    width: 100%;
    min-width: 0;
    padding: 13px 15px;
    border: 3px solid #23324d;
    border-radius: 14px;
    color: inherit;
    font: inherit;
    font-size: 1.05rem;
  }

  input[type="text"]:focus-visible,
  button:focus-visible {
    outline: 4px solid #ffbf47;
    outline-offset: 3px;
  }

  button {
    flex: 0 0 auto;
    padding: 12px 17px;
    border: 3px solid #23324d;
    border-radius: 14px;
    background: #ffbf47;
    color: #23324d;
    font: inherit;
    font-weight: 800;
    cursor: pointer;
  }

  button:hover {
    background: #ffd36f;
    transform: translateY(-1px);
  }

  .message {
    min-height: 28px;
    margin: 12px 0 0;
    color: #315e42;
    font-weight: 700;
    text-align: center;
  }

  .help {
    margin: 20px 0 0;
    padding: 14px 16px;
    border-radius: 16px;
    background: #f1f5ff;
    font-size: .95rem;
    line-height: 1.5;
  }

  .setting {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    margin: 14px 0 0;
    color: #53617a;
    font-size: .9rem;
    font-weight: 700;
    cursor: pointer;
  }

  /* checkbox styled as a toggle switch */
  .setting input {
    position: relative;
    flex: 0 0 auto;
    width: 40px;
    height: 24px;
    margin: 0;
    border: 2px solid #23324d;
    border-radius: 999px;
    background: #dfe6ef;
    appearance: none;
    cursor: pointer;
    transition: background 200ms ease-out;
  }

  .setting input::before {
    content: "";
    position: absolute;
    top: 2px;
    left: 2px;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #fff;
    box-shadow: 0 1px 2px rgb(35 50 77 / .4);
    transition: transform 200ms ease-out;
  }

  .setting input:checked {
    background: #2b8a4e;
  }

  .setting input:checked::before {
    transform: translateX(16px);
  }

  .setting input:focus-visible {
    outline: 4px solid #ffbf47;
    outline-offset: 2px;
  }

  .history {
    margin: 20px 0 0;
    padding-top: 14px;
    border-top: 2px dashed #dfe6ef;
    font-size: .95rem;
  }

  .history h2 {
    margin: 0 0 8px;
    color: #53617a;
    font-size: .95rem;
    text-align: center;
  }

  .history ul {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .history li {
    display: grid;
    grid-template-columns: 7.5em 1fr auto;
    gap: 8px;
    padding: 3px 0;
  }

  .history-day {
    color: #53617a;
  }

  @media (max-width: 420px) {
    main {
      padding: 24px 18px;
      box-shadow: 5px 5px 0 #23324d;
    }

    form {
      flex-direction: column;
    }
  }
</style>
