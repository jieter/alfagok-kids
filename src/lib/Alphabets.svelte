<script lang="ts">
  import type { AlphabetColumn } from "./game";

  let { columns }: { columns: AlphabetColumn[] } = $props();
</script>

<div class="alphabets" aria-hidden="true">
  {#each columns as column, index (index)}
    <ol class="alphabet" style:--shift={column.shift}>
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
    gap: 10px;
    transform: translateY(-50%);
  }

  .alphabet {
    display: flex;
    flex-direction: column;
    gap: .1em;
    margin: 0;
    padding: 0;
    color: #23324d;
    font-size: clamp(.8rem, 3vh, 1.4rem);
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

    .alphabet {
      flex-flow: row wrap;
      justify-content: center;
      gap: 2px 8px;
      font-size: 1.1rem;
      transform: none;
    }
  }
</style>
