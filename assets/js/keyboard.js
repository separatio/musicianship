window.MUS = window.MUS || {}

// SVG piano keyboard with correct 2-3 black-key grouping.
;(() => {
  const SVG_NS = 'http://www.w3.org/2000/svg'

  const svgEl = (name, attrs = {}) => {
    const el = document.createElementNS(SVG_NS, name)
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v))
    return el
  }

  // Semitone index within an octave for each pitch class.
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

  const WHITE_ORDER = ['C', 'D', 'E', 'F', 'G', 'A', 'B']
  // White-key index (0..6 within octave) → its semitone offset from C.
  const WHITE_SEMITONE = [0, 2, 4, 5, 7, 9, 11]

  // Parse 'C4', 'C#4', 'Db4' → { pc, octave, semitone } (absolute semitone for matching).
  const parseNote = (note) => {
    const m = /^([A-Ga-g])([#b]?)(-?\d+)$/.exec(note.trim())
    if (!m) return null
    const pc = m[1].toUpperCase() + (m[2] || '')
    if (!(pc in PC)) return null
    const octave = Number(m[3])
    return { semitone: octave * 12 + PC[pc] }
  }

  // Key geometry.
  const WHITE_W = 36
  const WHITE_H = 170
  const BLACK_W = 22
  const BLACK_H = 105
  const PAD = 2

  const keyboard = (spec = {}) => {
    const {
      octaves = 2,
      startNote = 'C',
      startOctave = 4,
      highlight = [],
      showLabels = false,
    } = spec

    const startPc = startNote.toUpperCase()
    const startWhiteIdx =
      WHITE_ORDER.indexOf(startPc) >= 0 ? WHITE_ORDER.indexOf(startPc) : 0
    const totalWhite = octaves * 7

    // Build the white-key list as { whiteName, octave, semitone, x }.
    const whites = []
    for (let i = 0; i < totalWhite; i++) {
      const idx = (startWhiteIdx + i) % 7
      const octShift = Math.floor((startWhiteIdx + i) / 7)
      const octave = startOctave + octShift
      const name = WHITE_ORDER[idx]
      whites.push({
        name,
        octave,
        semitone: octave * 12 + WHITE_SEMITONE[idx],
        x: PAD + i * WHITE_W,
        index: idx,
      })
    }

    // Highlight lookup by absolute semitone.
    const hlMap = new Map()
    for (const h of highlight) {
      const parsed = parseNote(h.note)
      if (parsed) hlMap.set(parsed.semitone, h)
    }

    const width = PAD * 2 + totalWhite * WHITE_W
    const height = PAD * 2 + WHITE_H

    const svg = svgEl('svg', {
      class: 'keyboard-svg',
      viewBox: `0 0 ${width} ${height}`,
      role: 'img',
    })

    // --- White keys first (drawn behind black keys) ---
    for (const w of whites) {
      const hl = hlMap.get(w.semitone)
      const rect = svgEl('rect', {
        class: hl ? 'kb-white kb-hl' : 'kb-white',
        x: w.x,
        y: PAD,
        width: WHITE_W - 1,
        height: WHITE_H,
        rx: 3,
        ...(hl?.color ? { fill: hl.color } : {}),
      })
      svg.appendChild(rect)

      const labelText =
        hl?.label ?? (showLabels ? `${w.name}${w.octave}` : null)
      if (labelText) {
        const txt = svgEl('text', {
          class: 'kb-label',
          x: w.x + (WHITE_W - 1) / 2,
          y: PAD + WHITE_H - 12,
          'text-anchor': 'middle',
          'font-size': 11,
        })
        txt.textContent = labelText
        svg.appendChild(txt)
      }
    }

    // --- Black keys ---
    // A black key sits to the RIGHT of a white key, between it and the next white key,
    // EXCEPT after E and after B (no black key there). Offset toward the boundary so
    // it straddles the gap: centred on the right edge of its parent white key.
    const NO_BLACK_AFTER = new Set([2, 6]) // white index 2 = E, 6 = B
    for (const w of whites) {
      if (NO_BLACK_AFTER.has(w.index)) continue
      // The black key is the sharp of this white key; one semitone above it.
      const semitone = w.semitone + 1
      const bx = w.x + WHITE_W - BLACK_W / 2 - PAD / 2
      const hl = hlMap.get(semitone)
      const rect = svgEl('rect', {
        class: hl ? 'kb-black kb-hl' : 'kb-black',
        x: bx,
        y: PAD,
        width: BLACK_W,
        height: BLACK_H,
        rx: 2,
        ...(hl?.color ? { fill: hl.color } : {}),
      })
      svg.appendChild(rect)

      if (hl?.label) {
        const txt = svgEl('text', {
          class: 'kb-label',
          x: bx + BLACK_W / 2,
          y: PAD + BLACK_H - 10,
          'text-anchor': 'middle',
          'font-size': 9,
          fill: '#fff',
        })
        txt.textContent = hl.label
        svg.appendChild(txt)
      }
    }

    return svg
  }

  // Auto-init: <div class="diagram" data-keyboard='{json}'></div>
  const initKeyboards = () => {
    for (const node of document.querySelectorAll('.diagram[data-keyboard]')) {
      if (node.querySelector('.keyboard-svg')) continue
      try {
        const spec = JSON.parse(node.getAttribute('data-keyboard'))
        node.appendChild(keyboard(spec))
      } catch (err) {
        const note = document.createElement('p')
        note.className = 'diagram-error'
        note.textContent = `Invalid keyboard data: ${err.message}`
        node.appendChild(note)
      }
    }
  }

  MUS.keyboard = keyboard

  document.addEventListener('DOMContentLoaded', initKeyboards)
})()
