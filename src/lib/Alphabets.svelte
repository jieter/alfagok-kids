<script lang="ts">
  import type { AlphabetColumn } from "./game";

  let { columns }: { columns: AlphabetColumn[] } = $props();

  function isCertain(column: AlphabetColumn): boolean {
    return column.letters.filter(({ possible }) => possible).length === 1;
  }

  // on narrow screens the certain letters are shown together on one line
  const known = $derived(
    columns
      .filter(isCertain)
      .map(column => column.letters.find(({ possible }) => possible)!.letter)
      .join(""),
  );
</script>

<div class="alphabets" aria-hidden="true">
  {#if known}
    <p class="known">{known}</p>
  {/if}
  {#each columns as column, index (index)}
    <!-- a certain letter is shown on its own, the grey letters keep their place but are hidden -->
    <ol class="alphabet" class:certain={isCertain(column)} style:--shift={column.shift}>
      {#each column.letters as { letter, possible } (letter)}
        <li class:impossible={!possible}>{letter}</li>
      {/each}
    </ol>
  {/each}
</div>

<style>
  .alphabets {
    position: fixed;
    top: 50%;
    left: 24px;
    display: flex;
    transform: translateY(-50%);
  }

  .alphabet + .alphabet {
    margin-left: 10px;
  }

  /* certain letters close together, so they read as the start of a word */
  .certain + .certain {
    margin-left: 1px;
  }

  .alphabet {
    display: flex;
    flex-direction: column;
    gap: 0.1em;
    margin: 0;
    padding: 0;
    color: #23324d;
    font-size: clamp(0.8rem, 3vh, 1.4rem);
    font-weight: 800;
    line-height: 1.1;
    list-style: none;
    text-align: center;
    /* one row is line-height plus gap */
    transform: translateY(calc(var(--shift, 0) * 1.2em));
    transition: transform 300ms ease-out;
  }

  .impossible {
    color: #c3cad6;
    transition: opacity 300ms ease-out;
  }

  /* hidden, and without width so the column is as narrow as its letter */
  .certain .impossible {
    width: 0;
    overflow: hidden;
    opacity: 0;
  }

  .known {
    display: none;
  }

  @media (max-width: 720px) {
    .alphabets {
      position: static;
      flex-direction: column;
      gap: 6px;
      width: min(100%, 560px);
      margin: 0 auto 16px;
      transform: none;
    }

    /* all 26 letters on one line: equal widths, font scaled to the screen width */
    .alphabet {
      flex-direction: row;
      gap: 0;
      font-size: min(1.1rem, 3.6vw);
      transform: none;
    }

    .alphabet li {
      flex: 1 1 0;
      min-width: 0;
    }

    .alphabet + .alphabet,
    .certain + .certain {
      margin-left: 0;
    }

    .certain {
      display: none;
    }

    .known {
      display: block;
      margin: 0;
      color: #23324d;
      font-size: 1.3rem;
      font-weight: 800;
      letter-spacing: 0.05em;
      text-align: center;
    }
  }
</style>
