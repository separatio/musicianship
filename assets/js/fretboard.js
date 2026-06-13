window.MUS = window.MUS || {}

// SVG guitar fretboard / chord diagram, vertical (chord-chart) orientation.
;(() => {
  const SVG_NS = 'http://www.w3.org/2000/svg'

  const svgEl = (name, attrs = {}) => {
    const el = document.createElementNS(SVG_NS, name)
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v))
    return el
  }

  // Layout constants (unitless; viewBox scales them).
  const PAD_TOP = 44 // room for open/muted markers + title
  const PAD_X = 36 // room for fret numbers on the left
  const STRING_GAP = 28
  const FRET_GAP = 40

  const fretboard = (spec = {}) => {
    const {
      frets = [0, 4],
      strings = 6,
      dots = [],
      muted = [],
      open = [],
      title,
    } = spec

    const [startFret, endFret] = frets
    const fretCount = Math.max(1, endFret - startFret)
    const nStrings = strings

    const gridW = (nStrings - 1) * STRING_GAP
    const gridH = fretCount * FRET_GAP
    const width = PAD_X * 2 + gridW
    const height = PAD_TOP + gridH + 16

    const svg = svgEl('svg', {
      class: 'fretboard-svg',
      viewBox: `0 0 ${width} ${height}`,
      role: 'img',
    })
    if (title) {
      const t = svgEl('title')
      t.textContent = title
      svg.appendChild(t)
    }

    const left = PAD_X
    const top = PAD_TOP

    // String number → x position. String 6 (low E) leftmost, string 1 (high E) rightmost.
    // x index for string s = (nStrings - s), so string6→0 ... string1→(nStrings-1).
    const stringX = (s) => left + (nStrings - s) * STRING_GAP
    // Fret 0 = nut line (top). Fret f line is at top + (f - startFret) * FRET_GAP.
    const fretY = (f) => top + (f - startFret) * FRET_GAP

    // Frets (horizontal lines).
    for (let f = startFret; f <= endFret; f++) {
      const isNut = f === 0
      const line = svgEl('line', {
        class: isNut ? 'fb-nut' : 'fb-fret',
        x1: left,
        y1: fretY(f),
        x2: left + gridW,
        y2: fretY(f),
        stroke: 'currentColor',
        'stroke-width': isNut ? 6 : 2,
        'stroke-linecap': 'round',
      })
      svg.appendChild(line)
    }

    // Strings (vertical lines).
    for (let s = 1; s <= nStrings; s++) {
      const x = stringX(s)
      svg.appendChild(
        svgEl('line', {
          class: 'fb-string',
          x1: x,
          y1: top,
          x2: x,
          y2: top + gridH,
          stroke: 'currentColor',
          'stroke-width': 2,
        }),
      )
    }

    // Fret number labels on the left. Show the starting fret when not at the nut,
    // otherwise number each fret space for orientation.
    if (startFret > 0) {
      const label = svgEl('text', {
        class: 'fb-fretnum',
        x: left - 12,
        y: fretY(startFret) + FRET_GAP / 2,
        'text-anchor': 'end',
        'dominant-baseline': 'middle',
        fill: 'currentColor',
        'font-size': 14,
      })
      label.textContent = String(startFret + 1)
      svg.appendChild(label)
    }

    // Open / muted markers above the nut.
    const markerY = top - 14
    const addMarker = (s, kind) => {
      const x = stringX(s)
      const text = svgEl('text', {
        class: kind === 'open' ? 'fb-open' : 'fb-muted',
        x,
        y: markerY,
        'text-anchor': 'middle',
        'dominant-baseline': 'middle',
        fill: 'currentColor',
        'font-size': 16,
      })
      text.textContent = kind === 'open' ? 'O' : 'X'
      svg.appendChild(text)
    }
    for (const s of open) addMarker(s, 'open')
    for (const s of muted) addMarker(s, 'muted')

    // Dots: filled circles centred in the fret space below the fret line.
    const radius = STRING_GAP * 0.42
    for (const d of dots) {
      const { string: s, fret: f, label, color } = d
      if (s == null || f == null) continue
      const x = stringX(s)
      // Place the dot in the middle of the space between fret (f-1) and fret f.
      const y = fretY(f) - FRET_GAP / 2
      const circle = svgEl('circle', {
        class: 'fb-dot',
        cx: x,
        cy: y,
        r: radius,
        fill: color || 'currentColor',
      })
      svg.appendChild(circle)

      if (label) {
        const txt = svgEl('text', {
          class: 'fb-dot-label',
          x,
          y,
          'text-anchor': 'middle',
          'dominant-baseline': 'central',
          fill: '#fff',
          'font-size': 13,
        })
        txt.textContent = label
        svg.appendChild(txt)
      }
    }

    return svg
  }

  // Auto-init: <div class="diagram" data-fretboard='{json}'></div>
  const initFretboards = () => {
    for (const node of document.querySelectorAll('.diagram[data-fretboard]')) {
      if (node.querySelector('.fretboard-svg')) continue
      try {
        const spec = JSON.parse(node.getAttribute('data-fretboard'))
        node.appendChild(fretboard(spec))
      } catch (err) {
        const note = document.createElement('p')
        note.className = 'diagram-error'
        note.textContent = `Invalid fretboard data: ${err.message}`
        node.appendChild(note)
      }
    }
  }

  MUS.fretboard = fretboard

  document.addEventListener('DOMContentLoaded', initFretboards)
})()
