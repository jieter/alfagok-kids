# Alfagok

Alfagok (https://alfagok.diginaut.net/) is een spelletje wat je het woord van de dag laat gokken en per gok aangeeft of het gezochte woord voor of na je gok komt.

De UI is eenvoudig: de woorden die je gokte die voor het woord van de dag komen staan voor het invoerveld, de woorden die er na komen staan er na.

```
geven
[input]
nemen
```

Als je het woord van de dag geraden hebt staat er in plaats van `[input]` een melding met een groene achtergrond, inclusief de tijd en het aantal gokken dat je nodig had.

- Gokken met woorden die niet op de woordenlijst staan tellen mee voor het aantal gokken
- Als het veld wordt leeggelaten telt dat niet mee.
- Iedere dag is er een nieuw woord

## Technisch
- Gebruik een svelte-frontend met vite/vitest.
- Maak de backend statisch (geen PHP/django).



## Kinderversie

Het spel kiest dagelijks een woord uit `woorden.txt`, een lijst met eenvoudige Nederlandse kinderwoorden (één woord per regel). Typ een woord; staat het niet in de lijst, dan wordt het in donkerrood getoond en telt het niet als poging, maar het staat wel op de juiste plek in het alfabet. Je pogingen verschijnen boven of onder het invoerveld om te laten zien waar het geheime woord in het alfabet staat.

### Ontwikkelen

Svelte + TypeScript, met Vite en Vitest.

```sh
npm install
npm run dev      # ontwikkelserver op http://localhost:5180/alfagok/
npm test         # tests (Vitest)
npm run check    # typecontrole (svelte-check)
npm run build    # statische site in dist/
```

De spellogica staat in `src/lib/game.ts`, de interface in `src/App.svelte`. `woorden.txt` wordt bij het bouwen in de app meegenomen. De site wordt gebouwd voor `/alfagok/` (zie `base` in `vite.config.ts`).
