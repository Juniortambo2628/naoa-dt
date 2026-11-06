import '@testing-library/jest-dom'

// jsdom implements no IntersectionObserver, so motion components that use
// `whileInView` (e.g. PolaroidFeed's sections) throw while rendering in
// tests. A no-op observer keeps them mounted at their initial state —
// content stays in the DOM, it just never "scrolls into view".
if (typeof window !== 'undefined' && typeof window.IntersectionObserver === 'undefined') {
  class IntersectionObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return []
    }
  }
  window.IntersectionObserver = IntersectionObserverStub
}
