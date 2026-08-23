# Utah VGC Team Graphic Generator

A single-page web app that replaces the old Google Sheets → Apps Script →
Google Slides pipeline for generating Utah VGC "top 4" results graphics.
Everything (form, live preview, PNG export, draft/version history) runs
client-side — no build step, no backend, deployable as-is on GitHub Pages.

Open `index.html` (locally or via GitHub Pages) and you get:

- One form for all inputs: tournament type, date, hosting store, organizer,
  and 1st–4th place player name / Twitter handle / 6 Pokémon + held items.
- A live preview of the graphic, styled to match the club's template.
- **Export PNG** — renders the graphic at up to 3× resolution (6000×3375)
  for a crisp upload to Twitter/X.
- **Drafts…** — save/load/duplicate named drafts, see every past export in
  history and reopen it for edits, and import/export drafts as JSON files.
- **Branding…** — upload the *real* background/logo image files once (they
  persist in the browser) so every graphic you generate after that matches
  your exact template pixel-for-pixel.

## Matching the real template exactly

The layout, fonts, colors, and every brand asset were pulled directly out of
the club's own template deck (`NEW_Top_Cut_Graphic_with_items_and_teras.pptx`)
rather than approximated from screenshots — extracted with `python-pptx`
(exact shape positions/sizes in EMU, converted 1:1 to px since the deck's
20"×11.25" slide maps directly onto this app's 2000×1125 canvas at
100px/inch) and by reading each text run's real font (**Oswald**, bold),
size, color, and drop-shadow spec straight out of the slide XML. `assets/`
ships the real files pulled from that deck, used as the defaults for
everything in **Branding…**:

- `assets/background.png` — the real Salt Lake City skyline/gradient
- `assets/org-logo.png` — the real circular Utah Pokémon VG Championships logo
- `assets/icon-x.png`, `assets/icon-globe.png` — the header's contact-row icons
- `assets/logos/*.png` — the tournament-type logos the deck showed: League
  Challenge, League Cup, Regional Championship, Global Challenge
- `assets/stores/game-grid.png` — the Game Grid store logo

**World Championship has no logo yet** — the deck didn't include one, so
that tournament type falls back to plain text until you upload it in
**Branding…** (*reminder, as requested*).

Uploading a file in **Branding…** stores a data-URL override in
`localStorage` on top of these bundled defaults (per tournament type / per
store), and **Reset to default** / **Remove** clears the override to fall
back to the real bundled asset again — not a placeholder.

Two things intentionally differ from the source deck:

- **Uniform sprite sizing** — the original graphics used each Pokémon
  sprite at its own native size (irregular). Per the original requirement
  that "Pokémon sprites must all have the same dimensionality," this app
  always renders them in a fixed box instead.
- **No Tera type icon** — every Pokémon slot in the source deck actually
  carries three stacked images (Pokémon, item, Tera type shard), because
  those example graphics were for mainline Scarlet/Violet events. Pokémon
  Champions has no Terastallizing mechanic, so this app only shows
  Pokémon + item, as scoped earlier.

The source deck also contains a structurally different graphic — a 6-player
"Day 1 / Swiss standings" layout (ordinal rank like "261st" instead of
1st–4th, a Day/location subtitle instead of a tournament title) — which
isn't built here. Ask if you want that as a second graphic type.

## Pokémon & item sprites

The roster is scoped to **Pokémon Champions** (not the full National Dex),
scraped from two sources rather than bundled:

- Pokémon art: [Bulbagarden Archives' "Champions menu sprites"
  category](https://archives.bulbagarden.net/wiki/Category:Champions_menu_sprites) —
  359 sprites covering 209 species, including every Mega/regional/etc. form
  the game gives its own sprite (e.g. "Charizard (Mega X)", "Tauros (Paldea
  Combat)"). Each file's page has a `{{menu sprite|<dex#>|<name>|CP|<form>}}`
  template, which is what names every entry — not a guessed slug.
- Item icons: [Pokébase's Pokémon Champions items
  list](https://pokebase.app/pokemon-champions/items) — 148 items, hosted on
  `i.pokebase.app`.

`js/data/pokemon.js` and `js/data/items.js` are flat `{name, url}` lists —
the exact sprite URL scraped for that entry, not a formula. `js/sprites.js`
just looks up a typed name (case/spacing-insensitive, with a loose fallback
for e.g. "Charizard Mega X" vs "Charizard (Mega X)") and returns its `url`.
Both Pokémon and item boxes are fixed-size (`object-fit: contain`), so every
Pokémon sprite is the same size as every other Pokémon sprite, and likewise
for items, regardless of the source image's native dimensions.

**If a Pokémon/item isn't in the Champions roster**, or you just want to
point at a different image: paste a direct image URL into the box instead
of a name. The app detects `http(s)://` input and uses it verbatim, no code
changes needed. A red dashed box on a sprite in the preview means it failed
to load — that's your cue to check the name/URL before exporting.

**Network access note**: sprites are hot-linked from `archives.bulbagarden.net`
and `i.pokebase.app`, and the Oswald font loads from `fonts.googleapis.com`/
`fonts.gstatic.com`, so if this app is ever run somewhere with restricted
outbound network access (e.g. a locked-down Claude Code cloud environment),
those domains — plus `pokebase.app` itself — need to be reachable for
sprites/fonts to load and for `js/data/*.js` to be regenerated. Everything
else (background, logos, icons) is bundled in `assets/` and needs no
network access.

## "Version control"

This is a static site with no database, so persistence is local-first:

- **Drafts** are named, timestamped snapshots of the full form saved to
  `localStorage`, editable and re-saveable at any time.
- **Export history** automatically logs every PNG export (its full form
  state, not the image) so you can reopen and tweak a past graphic.
- **Import/Export JSON** on any draft gives you a real, durable, shareable
  file — commit those into a repo (e.g. a `drafts/` folder here) if you
  want proper git-tracked history across devices/browsers, since
  `localStorage` alone is per-browser and can be cleared.

## Project layout

```
index.html          App shell: form fields, preview markup, dialogs, templates
css/style.css        All styling, including the 2000×1125 graphic itself (exact px
                     positions/fonts/colors extracted from the template deck)
assets/              Real brand assets extracted from the template deck (background,
                     org logo, contact icons, tournament-type logos, store logos)
js/data/pokemon.js    Scraped Champions species+form list: {name, sprite url}
js/data/items.js      Scraped Champions item list: {name, sprite url}
js/sprites.js         Name → sprite URL lookup (+ direct-URL override)
js/catalog.js         Tournament-type/store lists + their default (bundled) logos
js/state.js           State shape + all localStorage read/write helpers
js/render.js           Renders state+settings into the .graphic preview DOM
js/form.js             Builds the editor form and wires it to state
js/drafts.js            Drafts/export-history dialog logic
js/settings.js          Branding dialog logic (uploads, contact info, credits)
js/export.js            html2canvas PNG export
js/app.js               Bootstraps everything on page load
vendor/html2canvas.min.js  Vendored export library (no CDN dependency)
```

## Deployment

It's plain static HTML/CSS/JS — GitHub Pages serves it as-is from the repo
root with no build step. If Pokémon Champions adds species/forms/items later,
`js/data/*.js` needs re-scraping from the two sources above (ask for it to
be regenerated).

## Roadmap

- **Teamsheet / Pokepaste import** — parse a pasted Pokepaste or an
  uploaded photo of a handwritten/typed teamsheet to auto-fill a place's 6
  Pokémon + items instead of typing them in one at a time. Not built yet;
  the per-slot text inputs are the manual equivalent for now.
