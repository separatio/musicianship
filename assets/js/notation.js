window.MUS = window.MUS || {}

// Standard-notation rendering via vendored abcjs (global `ABCJS`).
;(() => {
  const resolveEl = (target) =>
    typeof target === 'string' ? document.querySelector(target) : target

  const renderNotation = (target, abc, opts = {}) => {
    const el = resolveEl(target)
    if (!el) return null

    if (!window.ABCJS || typeof window.ABCJS.renderAbc !== 'function') {
      console.warn(
        'MUS.renderNotation: window.ABCJS is missing; cannot render notation.',
      )
      el.textContent = '[notation unavailable: abcjs failed to load]'
      return null
    }

    return window.ABCJS.renderAbc(el, abc, {
      responsive: 'resize',
      add_classes: true,
      ...opts,
    })
  }

  // Auto-init: <figure class="score"><script type="text/abc">...</script><figcaption>..</figcaption></figure>
  const initScores = () => {
    for (const fig of document.querySelectorAll('.score')) {
      const abcScript = fig.querySelector('script[type="text/abc"]')
      if (!abcScript) continue

      const abc = abcScript.textContent.trim()
      if (!abc) continue

      // Skip if already rendered (idempotent auto-init).
      if (fig.querySelector('.score-render')) continue

      const holder = document.createElement('div')
      holder.className = 'score-render'
      // Insert the render before the figcaption so the caption stays last.
      const caption = fig.querySelector('figcaption')
      fig.insertBefore(holder, caption || null)

      renderNotation(holder, abc)
    }
  }

  MUS.renderNotation = renderNotation

  document.addEventListener('DOMContentLoaded', initScores)
})()
