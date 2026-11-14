<script lang="ts">
  import { onMount, tick } from "svelte";
  import dayWordsText from "../woorden/woord-van-de-dag.txt?raw";
  // a separate gzipped file with a hash in its name, so a changed dictionary is never cached
  import dictionaryUrl from "../woorden/woordenboek.txt?gzip";
  import Alphabets from "./lib/Alphabets.svelte";
  import { confetti } from "./lib/confetti";
  import { gunzipText } from "./lib/gzip";
  import {
    alphabetColumns,
    answerForDay,
    betweenGuesses,
    collator,
    dayNumber,
    decodeWord,
    encodeWord,
    findWord,
    formatDay,
    makeDictionary,
    type Dictionary,
    splitGuesses,
    startsOf,
  } from "./lib/game";
  import { chosenKey, clearGuesses, dailyKey, loadGuesses, loadHistory, saveGuesses, saveSolved } from "./lib/storage";

  // The dictionary decides whether a guess is a real word.
  let dictionary: Dictionary | undefined = $state.raw();
  const dictionaryLoaded = fetch(dictionaryUrl)
    .then(response => response.arrayBuffer())
    .then(gunzipText)
    .then(text => {
      dictionary = makeDictionary(text.split("\n").filter(Boolean));
    })
    .catch(() => {});

  const url = new URL(location.href);
  const day = dayNumber(new Date());
  // ?woord=<code> plays a word chosen by someone else instead of the word of the day
  const code = url.searchParams.get("woord") ?? "";
  const chosen = decodeWord(code);
  const answer = chosen ?? answerForDay(dayWordsText.split("\n").filter(Boolean), day);
  const storageKey = chosen ? chosenKey : dailyKey;
  const game = chosen ? code : day;

  function hint(guess: string): string {
    return collator.compare(guess, answer) < 0
      ? `${guess} komt eerder. Het geheime woord staat dus later!`
      : `${guess} komt later. Het geheime woord staat dus eerder!`;
  }

  // ?clear in the URL forgets the guesses of this game; it is removed so a reload does not clear again
  if (url.searchParams.has("clear")) {
    clearGuesses(storageKey);
    url.searchParams.delete("clear");
    history.replaceState(null, "", url);
  }

  const restored = loadGuesses(storageKey, game);
  const lastRestored = restored.at(-1);

  let guessed: string[] = $state(restored);
  let latest = $state(lastRestored);
  let typed = $state("");
  let message = $state(lastRestored && lastRestored !== answer ? hint(lastRestored) : "");
  let solvedWords = $state(loadHistory());
  let input: HTMLInputElement | undefined = $state();
  let success: HTMLElement | undefined = $state();

  const won = $derived(guessed.includes(answer));
  const split = $derived(splitGuesses(guessed, answer));
  const canStart = $derived(won ? startsOf(answer) : betweenGuesses(split.before.at(-1), split.after[0]));
  const columns = $derived(alphabetColumns(canStart));

  async function submit(event: SubmitEvent) {
    event.preventDefault();
    const text = typed.trim();
    await dictionaryLoaded;
    const listWord = dictionary && findWord(dictionary, text);
    // if the dictionary could not be loaded, any word is accepted
    if (!listWord && dictionary) {
      message = `${text} staat niet in mijn woordenboek. Probeer een ander woord!`;
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
    typed = "";
    saveGuesses(storageKey, game, $state.snapshot(guessed));
    message = guess === answer ? "" : hint(guess);

    if (guess === answer) {
      // only the words of the day are kept in the history
      if (!chosen) solvedWords = saveSolved({ day, word: answer, attempts: guessed.length });
      await tick();
      if (success) confetti(success);
    } else {
      input?.focus();
    }
  }

  let chooseTyped = $state("");
  let chooseMessage = $state("");
  let link = $state("");
  let copied = $state(false);

  async function makeLink(event: SubmitEvent) {
    event.preventDefault();
    const text = chooseTyped.trim();
    await dictionaryLoaded;
    // the other player can only guess words in the dictionary
    const word = dictionary ? findWord(dictionary, text) : text.toLocaleLowerCase("nl-NL");
    if (!word) {
      chooseMessage = `${text} staat niet in mijn woordenboek. Kies een ander woord!`;
      link = "";
      return;
    }
    // the typed word disappears, so whoever guesses does not see it
    chooseTyped = "";
    chooseMessage = "";
    copied = false;
    link = new URL(`?woord=${encodeWord(word)}`, location.origin + location.pathname).href;
  }

  async function copyLink() {
    await navigator.clipboard.writeText(link);
    copied = true;
  }

  onMount(() => {
    // also for games won before the history was kept
    if (won && !chosen && !solvedWords.some(entry => entry.day === day)) {
      solvedWords = saveSolved({ day, word: answer, attempts: guessed.length });
    }
    if (won && success) confetti(success);
    // not on narrow screens, where it would open the keyboard over the page
    if (matchMedia("(min-width: 721px)").matches) input?.focus();
  });
</script>

<main>
  <header>
    <h1>
      <span class="mascot" aria-hidden="true">🦊</span>Alfagok kids<span class="mascot" aria-hidden="true">🦊</span>
    </h1>
    <p class="intro" class:played={guessed.length > 0}>
      {#if chosen}
        Iemand heeft een geheim woord voor je gekozen. Staat jouw woord eerder of later in het alfabet?
      {:else}
        Raad het geheime woord. Staat jouw woord eerder of later in het alfabet?
      {/if}
    </p>
    <span class="counter">{guessed.length} {guessed.length === 1 ? "poging" : "pogingen"}</span>
  </header>

  <!-- fixed at the side of the screen; on narrow screens directly above the guesses -->
  <Alphabets {columns} />

  <section class="guesses" aria-label="Woorden die voor het geheime woord komen">
    <ul class="guess-list" aria-live="polite">
      {#each split.before as word (word)}
        <li class:just-guessed={word === latest}>{word}</li>
      {/each}
    </ul>
    <p class="zone-label">⬆ Eerder in het alfabet</p>
  </section>

  {#if won}
    <p class="success" role="status" bind:this={success}>
      Hoera! Het geheime woord is <strong>{answer}</strong>. Goed geraden!
    </p>
  {:else}
    <form onsubmit={submit}>
      <label for="guess-input" class="visually-hidden">Jouw woord</label>
      <input
        id="guess-input"
        name="guess"
        type="text"
        bind:this={input}
        bind:value={typed}
        placeholder="Typ een woord..."
        autocomplete="off"
        required />
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
  <p class="help">
    <strong>Zo speel je:</strong> typ een woord en druk op Gok. Ken ik je woord niet, dan mag je een ander woord proberen.
    Je ziet of het geheime woord eerder of later komt. Blijf raden tot je het vindt!
  </p>

  {#if !chosen && solvedWords.length > 0}
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

{#if chosen}
  <p class="back"><a href={location.pathname}>Terug naar het woord van de dag</a></p>
{/if}

<!-- out of the way: only for whoever wants to give someone else a word to guess -->
<details class="choose">
  <summary>Kies zelf een geheim woord</summary>
  <p>Maak een link en stuur die naar iemand die het woord moet raden.</p>
  <form onsubmit={makeLink}>
    <label for="choose-input" class="visually-hidden">Jouw geheime woord</label>
    <input
      id="choose-input"
      type="text"
      bind:value={chooseTyped}
      placeholder="Jouw geheime woord..."
      autocomplete="off"
      required />
    <button type="submit">Maak link</button>
  </form>
  {#if link}
    <div class="link">
      <label for="link-output" class="visually-hidden">Link</label>
      <input id="link-output" type="text" value={link} readonly onfocus={event => event.currentTarget.select()} />
      <button type="button" onclick={copyLink}>{copied ? "Gekopieerd!" : "Kopieer"}</button>
    </div>
  {/if}
  <p class="message" role="status" aria-live="polite">{chooseMessage}</p>
</details>

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
    margin-right: 0.2em;
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
    transition:
      opacity 600ms ease-out,
      max-height 600ms ease-out 300ms,
      margin 600ms ease-out 300ms;
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
  @keyframes pop {
    from {
      transform: scale(0.85);
    }
    to {
      transform: scale(1);
    }
  }

  .zone-label {
    margin: 0;
    color: #53617a;
    font-size: 0.88rem;
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
    font-size: 0.95rem;
    line-height: 1.5;
  }

  .history {
    margin: 20px 0 0;
    padding-top: 14px;
    border-top: 2px dashed #dfe6ef;
    font-size: 0.95rem;
  }

  .history h2 {
    margin: 0 0 8px;
    color: #53617a;
    font-size: 0.95rem;
    text-align: center;
  }

  .back,
  .choose {
    width: min(100%, 560px);
    margin: 24px auto 0;
    font-size: 0.95rem;
    text-align: center;
  }

  .back a {
    color: #23324d;
    font-weight: 700;
  }

  .choose summary {
    color: #53617a;
    font-weight: 700;
    cursor: pointer;
  }

  .choose p {
    margin: 10px 0 0;
  }

  .link {
    display: flex;
    gap: 8px;
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
