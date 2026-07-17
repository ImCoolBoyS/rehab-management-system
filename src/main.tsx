// @ts-nocheck
import React, {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  componentDidCatch(error) {
    this.setState({ error: error.toString() });
  }
  render() {
    if (this.state.error) {
      return React.createElement('div', {
        style: { padding: '40px', fontFamily: 'monospace', fontSize: '14px', background: '#fff', color: '#c00' }
      },
        React.createElement('h2', null, 'React Error:'),
        React.createElement('pre', { style: { background: '#fee', padding: '16px', borderRadius: '8px', overflow: 'auto', maxHeight: '400px' } }, this.state.error)
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);