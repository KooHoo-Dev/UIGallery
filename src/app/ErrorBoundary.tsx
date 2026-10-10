import { Component, type ReactNode } from 'react'

/** 표본 하나가 오류를 내도 갤러리 전체가 멈추지 않게 막는다 */
export class ErrorBoundary extends Component<{ label: string; children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error) {
    console.error(`[UI Gallery] ${this.props.label} 오류:`, error)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="stage-error" role="alert">
        <b>{this.props.label}을(를) 표시하지 못했습니다</b>
        <code>{this.state.error.message}</code>
      </div>
    )
  }
}
