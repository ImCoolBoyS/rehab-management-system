// @ts-nocheck
/* ErrorBoundary - React class component for catching render errors */
import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  error: string | null;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { error: null };
  }
  
  static getDerivedStateFromError(error: Error): State {
    return { error: error.toString() };
  }
  
  componentDidCatch(error: Error) {
    console.error('ErrorBoundary caught:', error);
  }
  
  render() {
    if (this.state.error) {
      return (
        <div style={{
          padding: '40px',
          fontFamily: 'monospace',
          fontSize: '14px',
          background: '#fff',
          color: '#c00'
        }}>
          <h2>React Error:</h2>
          <pre style={{
            background: '#fee',
            padding: '16px',
            borderRadius: '8px',
            overflow: 'auto',
            maxHeight: '400px'
          }}>
            {this.state.error}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}