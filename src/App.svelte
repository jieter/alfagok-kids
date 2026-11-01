<script lang="ts">
  import { onMount, tick } from "svelte";
  import wordsText from "../woorden.txt?raw";
  import Alphabets from "./lib/Alphabets.svelte";
  import { confetti } from "./lib/confetti";
  import {
    alphabetColumns,
    answerForDay,
    candidatesBetween,
    closestWord,
    collator,
    dayNumber,
    parseWords,
    splitGuesses,
  } from "./lib/game";
  import { loadGuesses, saveGuesses } from "./lib/storage";

  const words = parseWords(wordsText);
  const day = dayNumber(new Date());
  const answer = answerForDay(words, day);

  function hint(guess: string): string {
    return collator.compare(guess, answer) < 0
      ? `${guess} komt eerder. Het geheime woord staat dus later!`
      : `${guess} komt later. Het geheime woord staat dus eerder!`;
  }

  const restored = loadGuesses(day).filter(word => words.includes(word));
  const lastRestored = restored.at(-1);

  let guessed: string[] = $state(restored);
  let latest = $state(lastRestored);
  let typed = $state("");
  let message = $state(lastRestored && lastRestored !== answer ? hint(lastRestored) : "");
  let input: HTMLInputElement | undefined = $state();
  let success: HTMLElement | undefined = $state();

  const won = $derived(guessed.includes(answer));
  const split = $derived(splitGuesses(guessed, answer));
  const columns = $derived(alphabetColumns(
    won ? [answer] : candidatesBetween(words, split.before.at(-1), split.after[0])
  ));

  async function submit(event: SubmitEvent) {
    event.preventDefault();
    const text = typed.trim();
    const guess = closestWord(words, text);
    if (!guess) {
      message = `Ik ken geen woorden met de ${text[0].toLocaleLowerCase("nl-NL")}. Probeer een ander woord!`;
      input?.select();
      return;
    }
    const substituted = collator.compare(guess, text) !== 0;

    if (guessed.includes(guess)) {
      message = substituted
        ? `"${text}" ken ik niet. Het lijkt op ${guess}, maar dat woord heb je al geprobeerd. Kies een ander woord!`
        : "Dat woord heb je al geprobeerd. Kies een ander woord!";
      input?.select();
      return;
    }

    guessed.push(guess);
    latest = guess;
    typed = "";
    saveGuesses(day, $state.snapshot(guessed));
    message = guess === answer ? "" : hint(guess);
    if (substituted) {
      message = `"${text}" ken ik niet, dus ik probeer ${guess}. ${message}`;
    }

    if (guess === answer) {
      await tick();
      if (success) confetti(success);
    } else {
      input?.focus();
    }
  }

  onMount(() => {
    if (won && success) confetti(success);
  });
</script>

<Alphabets {columns} />

<main>
  <header>
    <h1><span class="mascot" aria-hidden="true">🦊</span>Alfagok kids<span class="mascot" aria-hidden="true">🦊</span></h1>
    <p class="intro">Raad het geheime woord. Staat jouw woord eerder of later in het alfabet?</p>
    <span class="counter">{guessed.length} {guessed.length === 1 ? "poging" : "pogingen"}</span>
  </header>

  <section class="guesses" aria-label="Woorden die voor het geheime woord komen">
    <ul class="guess-list" aria-live="polite">
      {#each split.before as word (word)}
        <li class:just-guessed={word === latest}>{word}</li>
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
        <li class:just-guessed={word === latest}>{word}</li>
      {/each}
    </ul>
  </section>

  <p class="message" role="status" aria-live="polite">{message}</p>
  <p class="help"><strong>Zo speel je:</strong> typ een woord en druk op Gok. Ken ik je woord niet, dan probeer ik een woord dat erop lijkt. Je ziet of het geheime woord eerder of later komt. Blijf raden tot je het vindt!</p>
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
    margin: 0 auto 24px;
    max-width: 390px;
    font-size: 1.05rem;
    line-height: 1.5;
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

  input {
    width: 100%;
    min-width: 0;
    padding: 13px 15px;
    border: 3px solid #23324d;
    border-radius: 14px;
    color: inherit;
    font: inherit;
    font-size: 1.05rem;
  }

  input:focus-visible,
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
