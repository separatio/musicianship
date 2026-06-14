# Vendored abcjs

This directory contains a vendored (offline) copy of the [abcjs](https://abcjs.net)
music-notation library — the "basic" browser bundle. It renders ABC notation to
SVG sheet music in the browser and exposes a global `ABCJS` object (UMD).

- **Version:** 6.6.3
- **File:** `abcjs-basic-min.js` (minified UMD bundle, 504,175 bytes)
- **Source:** https://cdn.jsdelivr.net/npm/abcjs@6.6.3/dist/abcjs-basic-min.js
- **Global exposed:** `ABCJS`
- **Primary entrypoint:** `ABCJS.renderAbc(target, abcString, params)`

## Why it's vendored

This project is served as static files over a local LAN with no internet access,
so the library is committed directly rather than pulled from a CDN or installed
via npm/bun. No `node_modules`, no build step — just this single browser bundle,
loaded with a plain `<script src="...">` tag.

## License

abcjs is MIT-licensed. The full license text is in `./LICENSE`
(Copyright (c) 2009-2024 Paul Rosen and Gregory Dyke).
