import { Component } from 'react'

/**
 * Contains a rendering failure to the current page so the shell (navigation,
 * status bar) stays usable. Reset by navigating — `resetKey` is the pathname.
 */
export default class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidUpdate(prev) {
    if (prev.resetKey !== this.props.resetKey && this.state.error) this.setState({ error: null })
  }

  componentDidCatch(error, info) {
    console.error('[NFR] page render failed', error, info.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="px-6 py-10">
        <div className="label mb-2 !text-crit">Page failed to render</div>
        <p className="max-w-xl text-[13px] text-fg-2">This view hit an unexpected error. Other sections are unaffected — choose one from the sidebar, or reload.</p>
        <pre className="mono mt-4 max-w-3xl overflow-x-auto border border-line bg-panel p-3 text-[11px] text-fg-3">{String(this.state.error?.message ?? this.state.error)}</pre>
        <button onClick={() => this.setState({ error: null })} className="mt-4 h-8 border border-line-strong px-3 text-[12.5px] text-fg-2 hover:bg-hover hover:text-fg">
          Retry
        </button>
      </div>
    )
  }
}
