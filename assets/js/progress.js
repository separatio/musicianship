window.MUS = window.MUS || {}

// localStorage-backed lesson/exercise progress.
;(() => {
  const KEY = 'mus:progress'

  const read = () => {
    try {
      return JSON.parse(localStorage.getItem(KEY)) || {}
    } catch {
      return {}
    }
  }

  const write = (data) => {
    try {
      localStorage.setItem(KEY, JSON.stringify(data))
    } catch (err) {
      console.warn('MUS.progress: failed to persist progress:', err)
    }
  }

  const emitChange = (detail) => {
    document.dispatchEvent(new CustomEvent('mus:progresschange', { detail }))
  }

  const lessonRecord = (data, lessonId) => {
    if (!data[lessonId]) data[lessonId] = { ex: {} }
    if (!data[lessonId].ex) data[lessonId].ex = {}
    return data[lessonId]
  }

  const all = () => read()

  const get = (lessonId) => read()[lessonId] || { ex: {} }

  const setEx = (lessonId, exId, bool) => {
    const data = read()
    lessonRecord(data, lessonId).ex[exId] = !!bool
    write(data)
    emitChange({ lessonId, exId, complete: !!bool })
  }

  const setComplete = (lessonId, bool) => {
    const data = read()
    lessonRecord(data, lessonId).complete = !!bool
    write(data)
    emitChange({ lessonId, complete: !!bool })
  }

  const isComplete = (lessonId) => !!get(lessonId).complete

  const trackStats = (lessonIds = []) => {
    const total = lessonIds.length
    const complete = lessonIds.reduce(
      (n, id) => n + (isComplete(id) ? 1 : 0),
      0,
    )
    const pct = total === 0 ? 0 : Math.round((complete / total) * 100)
    return { total, complete, pct }
  }

  // --- Auto-init ---
  const exChecks = (lessonId) =>
    Array.from(
      document.querySelectorAll(
        `input.check[data-lesson="${lessonId}"]:not([data-lesson-complete])`,
      ),
    )

  const allExChecked = (lessonId) => {
    const boxes = exChecks(lessonId)
    return boxes.length > 0 && boxes.every((b) => b.checked)
  }

  const initChecks = () => {
    const completeBoxes = Array.from(
      document.querySelectorAll('input.check.lesson-complete[data-lesson]'),
    )
    const exBoxes = Array.from(
      document.querySelectorAll('input.check[data-lesson][data-ex]'),
    )

    // Restore explicit lesson-complete checkboxes.
    for (const box of completeBoxes) {
      const lessonId = box.getAttribute('data-lesson')
      box.checked = isComplete(lessonId)
      box.addEventListener('change', () => {
        setComplete(lessonId, box.checked)
      })
    }

    // Restore exercise checkboxes and wire persistence.
    for (const box of exBoxes) {
      const lessonId = box.getAttribute('data-lesson')
      const exId = box.getAttribute('data-ex')
      box.checked = !!get(lessonId).ex?.[exId]

      box.addEventListener('change', () => {
        setEx(lessonId, exId, box.checked)

        // Auto-mark complete when every exercise for the lesson is checked.
        if (allExChecked(lessonId)) {
          setComplete(lessonId, true)
          const cBox = completeBoxes.find(
            (b) => b.getAttribute('data-lesson') === lessonId,
          )
          if (cBox) cBox.checked = true
        }
      })
    }
  }

  MUS.progress = {
    all,
    get,
    setEx,
    setComplete,
    isComplete,
    trackStats,
  }

  document.addEventListener('DOMContentLoaded', initChecks)
})()
