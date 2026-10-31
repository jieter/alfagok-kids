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

Open `index.html` in een browser om de kinderversie te spelen. Het spel kiest dagelijks een woord uit een ingebouwde lijst met eenvoudige Nederlandse kinderwoorden. Gok een woord uit de keuzelijst; je pogingen verschijnen boven of onder het invoerveld om te laten zien waar het geheime woord in het alfabet staat. Er zijn geen externe bibliotheken of netwerkverbinding nodig.