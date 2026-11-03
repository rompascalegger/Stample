# Stample: the slow art of peeling stamps

A cozy beach-side postcard and stamp collecting game in plain HTML, CSS and JavaScript. No build step, no dependencies.

## How to play

1. **Postcards arrive** from a chain of pen pals, exactly one in each of the world's 197 countries, each with a typical local name. A card always goes to the next country, and that country's pen pal writes the next card (often mentioning who wrote to them before).
2. **Peel the stamp slowly.** Drag across it again and again. Fast drags build up **strain**, and at full strain the stamp tears. Old stamps are more fragile and some cards are glued harder.
3. **The stamp** comes from the card's country and is a real issue from `stamps_filled.xml`. Its id is the country code and release year, like `GB-1840`.
4. **The seal** (postmark) comes from a random country, dated between the stamp's release year and 2026.
5. **Quality** (out of 100):
   - Condition: no tears 40, one 28, two 16, more 6
   - Luck: the closer the seal is to the stamp's center, the more of 25
   - Home seal: the seal is from the stamp's own country, +20
   - First day: the seal year is the stamp's release year, +15
6. **The album** keeps the best copy of every stamp. Sort it by origin (country, then year), by year or by seal quality. Stamps and countries you don't have yet are just **?**.

## The beach

Waves and a rolling tide, a striped towel under the postcard, a volleyball to keep in the air, visitors that pass by now and then, and 21 hidden secrets (the help screen counts them). Messages in bottles give hints.

## Files

| File | What it is |
|---|---|
| `index.html` | Page structure |
| `style.css` | Beach, postcard and album look |
| `script.js` | Peeling, quality, postcards, album, sound (Web Audio), beach and secrets |
| `data.js` | One pen pal per country (matched by name to the XML), stamp motifs, postcard texts |
| `stamps_filled.xml` | The world: 197 countries and their ~25,000 dated stamps |

Saves live in `localStorage` (`stample-v2`).

## Run locally

The XML is loaded with `fetch`, so the game needs a web server:

```bash
python -m http.server 8125
```
