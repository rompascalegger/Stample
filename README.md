# Stample: the slow art of peeling stamps

A cozy beach-side postcard and stamp collecting game in plain HTML, CSS and JavaScript. No build step, no dependencies.

## How to play

1. **Postcards arrive** from a chain of pen pals, exactly one in each of the world's 197 countries, each with a typical local name. A card always goes to the next country, and that country's pen pal writes the next card (often mentioning who wrote to them before).
2. **Tear it out.** Trace the dotted line (it forgives a bit of wobble and bridges small gaps) around the stamp, slowly, with the scissors following your finger. The paper rips open with white fibers and flying crumbs, and steady stretches earn "Steady!", "Smooth hands!" and "Like butter!". Rushing builds up **strain** (at full strain the stamp tears) and drawing across the stamp cuts into it. Staying close to the line gives a cleaner cut, and the piece pops loose at the end.
3. **Get it off: every card picks a minigame.** 🤏 Peel the corners (below), ♨️ steam it (hold to heat and keep the thermometer in the green zone; too hot and it curls), 🎯 wiggle it loose (tap while the marker is in the zone, five times, faster each time) or 🪶 tickle it off (rub back and forth quickly until it laughs itself off the card). Every move makes the stamp wobble like jelly.
   - **Peel the corners:** Drag from the glowing corner toward the middle in short, gentle strokes. The flap stretches as you pull, glue strands stretch underneath it and snap with a boing when the corner comes free. Pulling the wrong way strains it too. Old stamps are more fragile.
   - **⚡ Quick rip** skips the minigame: one yank, with the success chance shown on the button. Old, rare, glued-hard, sandy or already torn stamps have worse odds. Success gives a rushed but whole stamp; failure tears it.
   - **Gimmicks:** cards can be 🍯 extra sticky, 💧 wet (peels easily), 💨 windy (gusts tug at it), 🏖️ sandy (scratchy) or 🌟 shiny (a special worth +5). Sometimes a tiny crab hides under the stamp.
4. **The stamp** comes from the card's country and is a real issue from `stamps_filled.xml`. Its id is the country code and release year, like `GB-1840`. **The seal** (postmark) comes from a random country, dated between the stamp's release year and 2026.
5. **Quality** (out of 100):
   - Condition: no tears 35, one 24, two 13, three 4, then 8 less for every further tear, below zero. At 8 tears the stamp falls apart: a ☠️ PHILATELIC CATASTROPHE, with very sad trombones, filed in your album anyway.
   - Cut: up to 10 for a clean tear-out
   - Luck: up to 20, the closer the seal is to the stamp's center
   - **Specials**: up to 35 for remarkable seals, each announced with a crazy full-screen alert: home seal (same country as the stamp) +15, first day (sealed in the release year) +10, century +8, bullseye, boomerang, today's date, legendary +5, jubilee +4, double date, palindrome year, antique, surgeon-clean cut +3, shiny card +5. Some combine into combos like PHILATELIST'S DREAM or THE HOLY GRAIL. Anti-specials cost points: 🔪 butcher (a terrible cut) −5, 🎊 confetti (5+ tears) −10, 💥 total loss −25.
6. **The album** keeps the best copy of every stamp. Sort it by origin (country, then year), by year, by seal quality or by specials. Stamps and countries you don't have yet are just **?**.

## Postcards

Every pen pal writes in their own handwriting and ink color. Every card has its own tilt, paper (plain, pink, blue, kraft, lined, grid or aged), border (airmail stripes, dashed, double frame or dotted), doodles, sometimes a coffee stain, and one of four picture sides: classic "Greetings from", polaroids, retro sunset or a starry night.

## The beach

Bright sand with wind ripples, a turquoise sea with waves, a rolling tide and drifting clouds, palm trees, a striped towel under the postcard, a volleyball to keep in the air, visitors that pass by now and then, and 29 hidden secrets (the help screen counts them). Messages in bottles give hints.

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
