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

## Why it looks close-but-not-identical out of the box

I wasn't able to pull the actual background/logo image files out of the
screenshots you shared, so the app ships with a CSS-recreated version of the
layout (same structure, spacing, and typography) plus placeholder art:

- Background: a blue → orange CSS gradient standing in for the real
  skyline/gradient background image.
- Org logo (top right): a simple circular placeholder badge.
- Tournament type / store logos: fall back to plain bold text of the
  name until a logo is uploaded.

Open **Branding…** and upload your actual PNGs for the background, the
circular Utah VGC logo, each tournament-type logo (League Challenge, etc.),
and each store's logo. They're stored as data URLs in `localStorage` and
baked into every future graphic and PNG export — at that point the output
is your real template, not a recreation of it.

## Pokémon & item sprites

Sprites aren't bundled — they're hot-linked exactly like the original
Apps Script did:

- Pokémon art: `img.pokemondb.net/sprites/home/normal/<slug>.png`
- Item icons: `play.pokemonshowdown.com/sprites/itemicons/<slug>.png`

`js/data/pokemon.js` and `js/data/items.js` contain the full current-gen
species/item list (generated from Smogon's `@pkmn/dex` package) with a
best-effort slug for each entry, so typing a name in the form autocompletes
and resolves to the right sprite automatically. Both Pokémon and item boxes
are fixed-size (`object-fit: contain`), so every Pokémon sprite is the same
size as every other Pokémon sprite, and likewise for items, regardless of
the source image's native dimensions.

**If a slug is wrong** (a handful of obscure forms have irregular
pokemondb URLs) or you just want to point at a different image: paste a
direct image URL into the Pokémon/item box instead of a name. The app
detects `http(s)://` input and uses it verbatim, no code changes needed.
A red dashed box on a sprite in the preview means it failed to load —
that's your cue to check the name/URL before exporting.

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
css/style.css        All styling, including the 2000×1125 graphic itself
js/data/pokemon.js    Generated species list + pokemondb slug per entry
js/data/items.js      Generated item list + Showdown itemicon slug per entry
js/sprites.js         Name → sprite URL lookup (+ direct-URL override)
js/catalog.js         Tournament-type list, default store, placeholder logo
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
root with no build step. Regenerating the data files (if a new game
generation adds species/items) is done via the Node script setup described
in the comments at the top of `js/sprites.js` and by re-running the
`@pkmn/dex` extraction that produced `js/data/*.js` (ask for it to be
regenerated if you need the latest dex).

## Roadmap

- **Teamsheet / Pokepaste import** — parse a pasted Pokepaste or an
  uploaded photo of a handwritten/typed teamsheet to auto-fill a place's 6
  Pokémon + items instead of typing them in one at a time. Not built yet;
  the per-slot text inputs are the manual equivalent for now.
