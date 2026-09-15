import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/** Minimal error boundary: keeps an unexpected render error from blanking the page. */
export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('WebUI の描画中にエラーが発生しました', error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div style={{ padding: 24, fontFamily: 'sans-serif', lineHeight: 1.8 }}>
        <h2>予期しないエラーが発生しました</h2>
        <p>ページを再読み込みしてください。</p>
        <button type="button" onClick={() => location.reload()}>
          再読み込み
        </button>
      </div>
    );
  }
}
