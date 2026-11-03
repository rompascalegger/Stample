# Stample: the slow art of peeling stamps

A cozy beach-side postcard and stamp collecting game in plain HTML, CSS and JavaScript. No build step, no dependencies.

## How to play

1. **Postcards arrive** from a chain of pen pals, exactly one in each of the world's 197 countries, each with a typical local name. A card always goes to the next country, and that country's pen pal writes the next card (often mentioning who wrote to them before).
2. **Tear it out.** Trace the dotted line around the stamp, slowly. Rushing builds up **strain** (at full strain the stamp tears) and drawing across the stamp cuts into it. Staying close to the line gives a cleaner cut.
3. **Peel it, corner by corner.** Drag from the glowing corner toward the middle in short, gentle strokes. Pulling the wrong way strains it too. Old stamps are more fragile and some cards are glued harder.
4. **The stamp** comes from the card's country and is a real issue from `stamps_filled.xml`. Its id is the country code and release year, like `GB-1840`. **The seal** (postmark) comes from a random country, dated between the stamp's release year and 2026.
5. **Quality** (out of 100):
   - Condition: no tears 35, one 24, two 13, more 4
   - Cut: up to 10 for a clean tear-out
   - Luck: up to 20, the closer the seal is to the stamp's center
   - **Specials**: up to 35 for remarkable seals, each announced with a crazy full-screen alert: home seal (same country as the stamp) +15, first day (sealed in the release year) +10, century +8, bullseye, boomerang, today's date, legendary +5, jubilee +4, double date, palindrome year, antique, surgeon-clean cut +3. Some combine into combos like PHILATELIST'S DREAM or THE HOLY GRAIL.
6. **The album** keeps the best copy of every stamp. Sort it by origin (country, then year), by year, by seal quality or by specials. Stamps and countries you don't have yet are just **?**.

## The beach

Bright sand with wind ripples, a turquoise sea with waves, a rolling tide and drifting clouds, palm trees, a striped towel under the postcard, a volleyball to keep in the air, visitors that pass by now and then, and 24 hidden secrets (the help screen counts them). Messages in bottles give hints.

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
