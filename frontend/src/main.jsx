import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './i18n';
import './index.css'
import { BrowserRouter as Router } from 'react-router-dom';
import SafeErrorBoundary from './components/SafeErrorBoundary';

console.log("TOP: main.jsx loading...");
window.addEventListener('error', (e) => {
  console.error("GLOBAL ERROR CAPTURED:", e.error || e.message);
});
window.addEventListener('unhandledrejection', (e) => {
  console.error("UNHANDLED REJECTION:", e.reason);
});

console.log("main.jsx: Starting render...");
const rootElement = document.getElementById('root');
console.log("main.jsx: Root element found:", !!rootElement);

try {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <SafeErrorBoundary>
        <Router>
          <App />
        </Router>
      </SafeErrorBoundary>
    </React.StrictMode>,
  )
  console.log("main.jsx: render() called successfully");
} catch (e) {
  console.error("main.jsx: CRITICAL RENDER ERROR:", e);
}
