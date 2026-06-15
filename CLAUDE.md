# Musicianship — project instructions

A **static, framework-free** music-learning suite (guitar + piano), theory-first.
Plain HTML/CSS/vanilla JS, **no build step**, served by a one-file Bun server.
This is a **PUBLIC GitHub repo** — never commit personal data (names, emails,
local filesystem paths, other-project references). Generic curriculum content
only.

## Conventions

- **Runtime:** Bun (`bun serve.ts`). Never `node`/`npm`/`npx`.
- **Style:** Biome — single quotes, no semicolons, trailing commas, 2-space
  indent. Run `bunx @biomejs/biome check .` before finishing.
- **Do not** lint/format `assets/vendor/` (vendored abcjs) — it is excluded in
  `biome.json`.
- **Worktrees:** all work happens in a `.worktrees/<branch>` worktree.

## The `MUS.*` JavaScript contract

Scripts load as **plain `<script src>`** (not modules) into the global
`window.MUS`, always in this order:

1. `assets/vendor/abcjs/abcjs-basic-min.js`
2. `assets/js/notation.js`
3. `assets/js/fretboard.js`
4. `assets/js/keyboard.js`
5. `assets/js/progress.js`
6. page-specific (`assets/js/hub.js` on `index.html` only)

Engines auto-init on DOM patterns — author lessons with these, don't call the
APIs by hand:

- **Notation:** `MUS.renderNotation` auto-inits on
  `<figure class="score"><script type="text/abc">…</script><figcaption>…</figcaption></figure>`.
- **Fretboard:** `MUS.fretboard` auto-inits on
  `<div class="diagram" data-fretboard='{json}'>` → injects `<svg class="fretboard-svg">`
  with parts `.fb-string/.fb-fret/.fb-dot/.fb-dot-label/.fb-open/.fb-muted/.fb-fretnum/.fb-nut`.
- **Keyboard:** `MUS.keyboard` auto-inits on
  `<div class="diagram" data-keyboard='{json}'>` → injects `<svg class="keyboard-svg">`
  with parts `.kb-white/.kb-black/.kb-hl/.kb-label`.
- **Progress:** `MUS.progress` — localStorage key `mus:progress`. Checkboxes are
  `<input type="checkbox" class="check" data-lesson="ID" data-ex="EXID">` plus a
  `<input class="check lesson-complete" data-lesson data-lesson-complete>`.
  Methods: `.trackStats(lessonIds) -> {total, complete, pct}`, `.isComplete(id)`,
  `.all()`. Dispatches `mus:progresschange` on `document`.

## Data

`data/curriculum.json` is the **single source of truth** (title, tagline,
tracks → lessons with `id`, `n`, `title`, `file`, `status`, `summary`,
`prereqs`). The hub renders entirely from it. Add/edit lessons here first.
`status` is `published` or `planned`; planned lessons render muted/locked.

## Lesson page template sections

A lesson page loads the shared scripts + `site.css` and uses these classes:
`.lesson`, `.lesson-header` (with `.track-tag`), `.crumbs`, `.prereqs`,
prose in `.lesson-prose`, `.callout` (+ `.callout.why`, `.callout.tip`),
`.both-instruments` (piano | guitar grid), `.score`, `.diagram`,
`.interval-table`/tables, `.exercise` (with `.check` checkboxes),
`.resources` (with `.chip.article/.video/.trainer`), `.lesson-nav`
(prev | hub | next).

## Authoring gotchas (these caused real errors — check every one)

**ABC notation** (inside `<script type="text/abc">`):
- Octave register: bare uppercase `C` = C4 (middle C); `C,` = C3, `C,,` = C2;
  lowercase `c` = C5, `c'` = C6. Chords sound together as `[CEG]`. Spell every
  score in the octave its caption claims.
- Bar math: each bar's durations must sum to the meter, and **abcjs does not
  warn on over/underfull bars**. Under `L:1/4` a 4/4 bar needs 4 quarter-units
  (whole note = `C4`); under `L:1/2` a 4/4 bar holds only 2 units (whole note =
  `C2`, NOT `C4`). Re-check each bar after writing.
- The key signature alters bare notes: under `K:Em` a bare `F` sounds F#.
- Grand staff: group two staves with `%%score { (S A) (T B) }` (braces) +
  `V:n clef=treble|bass`; confirm it renders TWO staves, not one.

**Diagram JSON** (`data-fretboard` / `data-keyboard`):
- Fretboard: string 1 = high E, string 6 = low E. Compute each dot's pitch from
  standard tuning (low→high `E A D G B E`) and confirm it matches the label.
- Keyboard: `"octaves":1` from C4 renders only C4–B4 (no C5) — every `highlight`
  note must fall in the rendered range. Spell sharps as `"G#5"`; `"Gb5"` lands on
  the black key one step lower.

**Cross-track links:** from `lessons/<track>/`, assets = `../../assets/...`,
hub = `../../index.html`, a theory lesson = `../theory/NN-slug.html`, a sibling
lesson = `NN-slug.html`.

## Verification protocol (authoring)

- Every theory claim backed by **≥2 authoritative sources**.
- Every external link **fetched and confirmed** live before shipping.
- **Render-check in mobile landscape** — scores and diagrams are landscape-first;
  confirm they read on a phone/tablet held sideways.
- Run the dev server and click through; never claim "done" without a render
  check.
