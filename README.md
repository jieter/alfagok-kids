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

Het geheime woord van de dag staat in `woorden/woord-van-de-dag.txt`, een lijst met eenvoudige Nederlandse kinderwoorden (één woord per regel, de eerste regel is 1 november 2026). Je mag elk Nederlands woord gokken; staat het niet in het woordenboek (`woorden/woordenboek.txt`), dan mag je een ander woord proberen. Je pogingen verschijnen boven of onder het invoerveld om te laten zien waar het geheime woord in het alfabet staat.

### Ontwikkelen

Svelte + TypeScript, met Vite en Vitest.

```sh
npm install
npm run dev      # ontwikkelserver op http://localhost:5180/alfagok/
npm test         # tests (Vitest)
npm run check    # typecontrole (svelte-check)
npm run build    # statische site in dist/
```

De spellogica staat in `src/lib/game.ts`, de interface in `src/App.svelte`. `woorden/woord-van-de-dag.txt` wordt bij het bouwen in de app meegenomen, het woordenboek wordt bij het opstarten opgehaald (als los bestand met een hash in de naam, zodat een nieuwe versie nooit uit de cache komt). De site wordt gebouwd voor `/alfagok/` (zie `base` in `vite.config.ts`).

### Woordenlijsten

- `woorden/woord-van-de-dag.txt`: met de hand bijgehouden kinderwoorden, één per dag; de eerste regel is 1 november 2026. Voeg nieuwe woorden onderaan toe, dan veranderen bestaande dagen niet.
- `woorden/woordenboek.txt`: zoveel mogelijk Nederlandse woorden (ongeveer 350.000), gemaakt door `woorden/create_wordlist.py` uit de woordenlijsten van [OpenTaal](https://github.com/OpenTaal/opentaal-wordlist) (BSD / CC BY 3.0), plus alle geheime woorden.

Na het toevoegen van geheime woorden het woordenboek bijwerken (de bronbestanden worden zo nodig in `woorden/bronnen/` gedownload):

```sh
python3 woorden/create_wordlist.py
```

