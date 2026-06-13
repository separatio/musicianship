# Musicianship

A self-hosted, theory-first music-learning suite for **guitar and piano**.

The idea is simple: learn *music itself* — pitch, rhythm, harmony, counterpoint,
form — and apply each concept directly on the fretboard and the keyboard. The
Theory Core is built up in strict order so every later idea rests on an earlier
one, and the Guitar, Piano, Repertoire, and Practice tracks turn that theory
into something you can actually play.

It is a plain static website: no framework, no build step, no accounts, no
network calls. Open it on a phone or tablet on your music stand and tick
exercises off as you go.

## Running it

You need [Bun](https://bun.sh).

```sh
bun serve.ts
```

The server prints a local URL plus every LAN address it can reach you on:

```
On your network:
  http://192.168.1.42:8080
```

Open the **network** address on your phone or tablet on the same Wi-Fi. Set a
different port with `PORT=3000 bun serve.ts`.

You can also point any other static file server at the project root — there is
nothing to compile.

## Tech

- **Static HTML + CSS + vanilla JavaScript.** No framework, no bundler.
- **Scripts load as plain `<script src>`** and share a single `window.MUS`
  namespace.
- **[abcjs](https://www.abcjs.net/) is vendored** in `assets/vendor/abcjs/` so
  notation renders fully offline.
- **Progress is local.** Exercise checkboxes are saved to `localStorage` under
  the key `mus:progress`; nothing leaves the device.
- **Bun** for the dev server, **Biome** for formatting and linting.

## Project layout

```
index.html              The hub: lists every track and lesson with progress.
serve.ts                One-file Bun static server for LAN use.
biome.json              Formatter + linter config.
data/
  curriculum.json       Single source of truth: tracks, lessons, status, prereqs.
assets/
  css/site.css          The whole design system (dark + light themes).
  js/                   Shared engines (notation, fretboard, keyboard, progress)
                        and the hub renderer.
  vendor/abcjs/         Vendored abcjs bundle (offline notation).
lessons/<track>/        Lesson pages, e.g. lessons/theory/05-intervals.html.
```

## License

MIT — see [LICENSE](LICENSE).
