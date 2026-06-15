// Validate Musicianship lesson scores and diagrams that render wrong silently.
//
// abcjs and the SVG diagram engines accept several classes of bad input without
// any warning: ABC bars whose durations don't sum to the meter, score cards with
// no notation, fretboard dots mislabeled against standard tuning, and keyboard
// highlights outside the rendered range. This script catches all of them.
//
// Usage:
//   bun scripts/validate-lessons.mjs [file ...]   check the given HTML files
//   bun scripts/validate-lessons.mjs               scan all lessons + index.html
//
// Exits non-zero on any failure (so the pre-commit hook can block).

import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

// abcjs is a UMD bundle that expects a browser global; give it one before load.
globalThis.window = globalThis
const ABCJS = require(`${root}/assets/vendor/abcjs/abcjs-basic-min.js`)

// --- constants (carried over verbatim from the throwaway /tmp checkers) -------

const PC = {
  C: 0,
  'C#': 1,
  Db: 1,
  D: 2,
  'D#': 3,
  Eb: 3,
  E: 4,
  F: 5,
  'F#': 6,
  Gb: 6,
  G: 7,
  'G#': 8,
  Ab: 8,
  A: 9,
  'A#': 10,
  Bb: 10,
  B: 11,
}
const NAME = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
// open-string pitch class by string number (1 = high E ... 6 = low E)
const OPEN = { 1: 4, 2: 11, 3: 7, 4: 2, 5: 9, 6: 4 }

const EPS = 1e-6

// absolute semitone of a spelled note like "G#5" / "Bb3" / "C-1"
const semitone = (note) => {
  const m = /^([A-G][#b]?)(-?\d+)$/.exec(note)
  if (!m) return null
  return (Number(m[2]) + 1) * 12 + PC[m[1]]
}

// --- checks -------------------------------------------------------------------

// ABC: parser warnings + bar-completeness (durations sum to the meter).
function checkAbc(html, file, fail) {
  const re = /<script type="text\/abc">([\s\S]*?)<\/script>/g
  let idx = 0
  for (const m of html.matchAll(re)) {
    idx++
    const abc = m[1].trim()
    // One <script> block can hold several tunes (multiple X: headers); check all.
    const tunes = ABCJS.parseOnly(abc)
    if (!tunes.length) {
      fail(`${file} abc#${idx}: abcjs produced no tune`)
      continue
    }
    tunes.forEach((tune, ti) => {
      const where =
        tunes.length > 1
          ? `${file} abc#${idx} tune#${ti + 1}`
          : `${file} abc#${idx}`
      for (const w of tune.warnings || []) fail(`${where}: abcjs warning: ${w}`)
      checkBars(tune, where, fail)
    })
  }
}

// Walk every voice, sum note/chord/rest durations between bar markers, and
// compare each bar to the meter. Overfull bars are always wrong; underfull bars
// are flagged only when interior, so a pickup (anacrusis) or an intentional
// short final bar doesn't trip the check.
function checkBars(tune, where, fail) {
  const barLen =
    typeof tune.getBarLength === 'function' ? tune.getBarLength() : 0
  if (!(barLen > 0)) return // free meter (M:none) — no bar length to check against
  const meter = tune.getMeterFraction?.() || {}
  const meterStr = meter.num != null ? `${meter.num}/${meter.den}` : '?'

  // bars per voice (keyed by staff:voice) accumulated across all lines/systems,
  // since a line break does not introduce a bar
  const voices = {}
  for (const line of tune.lines || []) {
    for (const [si, staff] of (line.staff || []).entries()) {
      for (const [vi, voice] of (staff.voices || []).entries()) {
        const key = `${si}:${vi}`
        if (!voices[key]) voices[key] = [{ sum: 0, count: 0 }]
        const bars = voices[key]
        // A tuplet's notes carry their *written* duration; abcjs records the
        // playback ratio as tripletMultiplier on the first note (startTriplet)
        // and runs it through the note flagged endTriplet. Apply it so e.g. an
        // eighth-note triplet sums to one quarter, not three eighths.
        let tupletMult = 1
        for (const el of voice) {
          if (el.el_type === 'bar') {
            bars.push({ sum: 0, count: 0 })
          } else if (el.rest?.type === 'multimeasure') {
            // A multi-measure rest (Zn) is one element spanning whole bars; it
            // fills its bar by definition, so count it as exactly full.
            const cur = bars[bars.length - 1]
            cur.sum = barLen
            cur.count++
          } else if (el.el_type === 'note' && typeof el.duration === 'number') {
            if (el.startTriplet) tupletMult = el.tripletMultiplier ?? 1
            const cur = bars[bars.length - 1]
            cur.sum += el.duration * tupletMult
            cur.count++
            if (el.endTriplet) tupletMult = 1
          }
        }
      }
    }
  }

  for (const key of Object.keys(voices)) {
    const bars = voices[key].filter((b) => b.count > 0)
    const voiceTag = Object.keys(voices).length > 1 ? ` voice ${key}` : ''
    bars.forEach((b, i) => {
      if (b.sum > barLen + EPS) {
        fail(
          `${where}:${voiceTag} bar ${i + 1} overfull — ${b.sum} of ${barLen} whole-note units (M:${meterStr})`,
        )
      } else if (b.sum < barLen - EPS && i !== 0 && i !== bars.length - 1) {
        fail(
          `${where}:${voiceTag} bar ${i + 1} underfull — ${b.sum} of ${barLen} whole-note units (M:${meterStr})`,
        )
      }
    })
  }
}

// Any <figure class="score"> must contain an ABC script (the flagship-page bug
// was an empty score card that rendered nothing).
function checkEmptyScores(html, file, fail) {
  const re =
    /<figure\b[^>]*class="[^"]*\bscore\b[^"]*"[^>]*>([\s\S]*?)<\/figure>/g
  let idx = 0
  for (const m of html.matchAll(re)) {
    idx++
    if (!/type="text\/abc"/.test(m[1])) {
      fail(
        `${file} score#${idx}: <figure class="score"> has no <script type="text/abc">`,
      )
    }
  }
}

// Fretboard: valid JSON; note-name dot labels match standard-tuning pitch; frets
// within the rendered window.
function checkFretboards(html, file, fail) {
  const re = /data-fretboard='([^']*)'/g
  let idx = 0
  for (const m of html.matchAll(re)) {
    idx++
    let spec
    try {
      spec = JSON.parse(m[1])
    } catch (e) {
      fail(`${file} fretboard#${idx}: invalid JSON — ${e.message}`)
      continue
    }
    const minFret = spec.frets?.[0] ?? 0
    const maxFret = spec.frets?.[1] ?? minFret + 4
    for (const d of spec.dots || []) {
      if (
        typeof d.fret === 'number' &&
        (d.fret < minFret || d.fret > maxFret)
      ) {
        fail(
          `${file} fretboard#${idx}: fret ${d.fret} outside window [${minFret}..${maxFret}]`,
        )
      }
      const label = String(d.label ?? '').trim()
      if (!/^[A-G][#b]?$/.test(label)) continue // only note-name labels are checkable
      if (typeof d.fret !== 'number') {
        fail(
          `${file} fretboard#${idx}: dot labeled "${label}" has non-numeric fret ${JSON.stringify(d.fret)}`,
        )
        continue
      }
      const open = OPEN[d.string]
      if (open == null) {
        fail(`${file} fretboard#${idx}: invalid string ${d.string}`)
        continue
      }
      const computed = (open + d.fret) % 12
      if (computed !== PC[label]) {
        fail(
          `${file} fretboard#${idx}: string ${d.string} fret ${d.fret} = ${NAME[computed]}, labeled "${label}"`,
        )
      }
    }
  }
}

// Keyboard: valid JSON; every highlight note within the rendered range; spellings
// parse.
function checkKeyboards(html, file, fail) {
  const re = /data-keyboard='([^']*)'/g
  let idx = 0
  for (const m of html.matchAll(re)) {
    idx++
    let spec
    try {
      spec = JSON.parse(m[1])
    } catch (e) {
      fail(`${file} keyboard#${idx}: invalid JSON — ${e.message}`)
      continue
    }
    const startNote = spec.startNote || 'C'
    const startO = spec.startOctave ?? 4
    const octs = spec.octaves || 2
    const lo = semitone(`${startNote}${startO}`)
    if (lo == null) {
      fail(
        `${file} keyboard#${idx}: unparseable startNote "${startNote}${startO}"`,
      )
      continue
    }
    const hi = lo + octs * 12 // half-open upper bound
    for (const h of spec.highlight || []) {
      const s = semitone(h.note)
      if (s == null) {
        fail(`${file} keyboard#${idx}: unparseable highlight "${h.note}"`)
      } else if (s < lo || s >= hi) {
        fail(
          `${file} keyboard#${idx}: highlight ${h.note} out of range [${startNote}${startO}..+${octs}oct]`,
        )
      }
    }
  }
}

// --- driver -------------------------------------------------------------------

async function filesToCheck() {
  const args = process.argv.slice(2)
  if (args.length) return args
  const glob = new Bun.Glob('lessons/**/*.html')
  const found = []
  for await (const f of glob.scan({ cwd: root })) found.push(`${root}/${f}`)
  found.push(`${root}/index.html`)
  return found.sort()
}

const files = await filesToCheck()
const failures = []
const fail = (msg) => failures.push(msg)

for (const file of files) {
  const html = await Bun.file(file).text()
  checkAbc(html, file, fail)
  checkEmptyScores(html, file, fail)
  checkFretboards(html, file, fail)
  checkKeyboards(html, file, fail)
}

if (failures.length) {
  for (const f of failures) console.error(`FAIL ${f}`)
  console.error(`\n${failures.length} problem(s) in ${files.length} file(s).`)
  process.exit(1)
}
console.log(`OK — ${files.length} file(s) clean.`)
