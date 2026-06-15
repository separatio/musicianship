---
name: author-lesson
description: Authoring or revising a Musicianship lesson page across the theory, guitar, piano, repertoire, and practice tracks — invoke as `/author-lesson <track>/<NN-slug>`, or whenever asked to add or revise a lesson.
---

# Authoring a Musicianship lesson

Invoke as `/author-lesson <track>/<NN-slug>` (e.g. `/author-lesson theory/27-foo`),
reading `$ARGUMENTS` for the target lesson. Also model-invocable: run this loop
whenever the user asks to add or revise a lesson on any track (theory, guitar,
piano, repertoire, practice).

This codifies the per-lesson loop. It points at the contracts; it does not repeat
them. Read `CLAUDE.md` for the authoritative `MUS.*` contract, template sections,
authoring gotchas, and verification protocol.

## The 7-step loop

1. **Read the reference.** Open `lessons/theory/05-intervals.html` (the template
   lesson) and `CLAUDE.md` — specifically the `MUS.*` JavaScript contract and the
   *Authoring gotchas* section. Match the template's structure and voice.

2. **Author or revise the HTML** using the engine's auto-init DOM patterns, not the
   JS APIs by hand:
   - `<figure class="score">` wrapping `<script type="text/abc">…</script>` + a
     `<figcaption>`.
   - `<div class="diagram" data-fretboard='{json}'>` and `data-keyboard='{json}'`.
   - `.exercise` blocks with `.check` checkboxes; a `.resources` list of
     `.chip` links; `.lesson-nav` (prev | hub | next); plus `.lesson`,
     `.lesson-header`/`.track-tag`, `.crumbs`, `.prereqs`, `.lesson-prose`,
     `.callout`, `.both-instruments`, tables.

   Obey every gotcha: ABC octave register, bar math summing to the meter,
   key-signature accidentals on bare notes, grand-staff `%%score` rendering two
   staves; fretboard string numbering (1 = high E, 6 = low E) vs standard tuning;
   keyboard range and sharp/flat spelling; cross-track relative links.

3. **Validate.** Run `bun scripts/validate-lessons.mjs <file>` and fix until it
   exits clean.

4. **Verify the theory.** In an independent pass, check every theoretical claim
   against at least two authoritative sources; fix anything flagged.

5. **Verify resources.** Fetch every external URL — expect HTTP 200 and on-topic
   content. Never invent or fabricate URLs.

6. **Render-check.** Run the dev server (`bun serve.ts`) and open the page in a
   headless browser. Confirm scores and diagrams render, it reads in mobile
   landscape, and the console has zero errors.

7. **Publish.** In `data/curriculum.json`, flip the lesson's `status` to
   `published`. Ensure its entry exists under the right track with correct
   `id`, `n`, `title`, `file`, `summary`, and `prereqs`.
