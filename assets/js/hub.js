window.MUS = window.MUS || {}

// Index hub: fetch the curriculum and render track cards with progress.
;(() => {
  const tracksEl = document.getElementById('tracks')
  const overallEl = document.getElementById('overall-progress')
  const overallPct = document.getElementById('overall-pct')
  const overallFill = document.getElementById('overall-fill')

  let curriculum = null

  const publishedIds = (track) =>
    track.lessons.filter((l) => l.status === 'published').map((l) => l.id)

  const allPublishedIds = (data) => data.tracks.flatMap(publishedIds)

  const stats = (ids) => {
    if (
      window.MUS.progress &&
      typeof window.MUS.progress.trackStats === 'function'
    ) {
      return window.MUS.progress.trackStats(ids)
    }
    return { total: ids.length, complete: 0, pct: 0 }
  }

  const isComplete = (id) => Boolean(window.MUS.progress?.isComplete(id))

  const el = (tag, attrs = {}, children = []) => {
    const node = document.createElement(tag)
    for (const [k, v] of Object.entries(attrs)) {
      if (k === 'class') node.className = v
      else if (k === 'text') node.textContent = v
      else node.setAttribute(k, v)
    }
    for (const child of children) {
      if (child) node.appendChild(child)
    }
    return node
  }

  const lessonItem = (lesson) => {
    const planned = lesson.status !== 'published'
    const done = !planned && isComplete(lesson.id)
    const n = el('span', {
      class: 'lesson-n',
      text: String(lesson.n).padStart(2, '0'),
    })
    const title = el('span', { class: 'lesson-title', text: lesson.title })

    const trailing = planned
      ? el('span', { class: 'badge-planned', text: 'planned' })
      : el('span', { class: 'lesson-check', text: done ? '✓' : '' })

    const li = el('li')
    if (planned) {
      const span = el('span', { class: 'lesson-link planned' }, [
        n,
        title,
        trailing,
      ])
      li.appendChild(span)
    } else {
      const a = el(
        'a',
        {
          class: `lesson-link${done ? ' is-complete' : ''}`,
          href: lesson.file,
        },
        [n, title, trailing],
      )
      li.appendChild(a)
    }
    return li
  }

  const trackCard = (track) => {
    const ids = publishedIds(track)
    const s = stats(ids)

    const list = el(
      'ul',
      { class: 'lesson-list' },
      track.lessons.map(lessonItem),
    )

    const children = [
      el('h3', { text: track.name }),
      el('p', { class: 'track-blurb', text: track.blurb }),
    ]

    if (ids.length > 0) {
      const label = el('div', { class: 'track-progress-label' }, [
        el('span', { text: `${s.complete} / ${s.total} done` }),
        el('span', { text: `${s.pct}%` }),
      ])
      const fill = el('div', { class: 'progress-fill' })
      fill.style.width = `${s.pct}%`
      const bar = el('div', { class: 'progress-bar' }, [fill])
      children.push(el('div', { class: 'track-progress' }, [label, bar]))
    }

    children.push(list)
    return el('div', { class: 'track-card' }, children)
  }

  const renderOverall = () => {
    if (!curriculum || !overallEl) return
    const ids = allPublishedIds(curriculum)
    if (ids.length === 0) return
    const s = stats(ids)
    overallEl.hidden = false
    overallPct.textContent = `${s.pct}%`
    overallFill.style.width = `${s.pct}%`
  }

  const render = () => {
    if (!curriculum) return
    tracksEl.replaceChildren(...curriculum.tracks.map(trackCard))
    renderOverall()
  }

  const showMessage = (msg) => {
    tracksEl.replaceChildren(el('p', { class: 'hub-message', text: msg }))
  }

  const load = async () => {
    try {
      const res = await fetch('data/curriculum.json')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      curriculum = await res.json()
      render()
    } catch (err) {
      console.error('hub: failed to load curriculum.json', err)
      showMessage(
        'Could not load the curriculum. Make sure you are viewing this through the dev server (bun serve.ts), not opening the file directly.',
      )
    }
  }

  document.addEventListener('mus:progresschange', () => {
    if (curriculum) render()
  })

  load()
})()
