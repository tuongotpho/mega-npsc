
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import GlobalErrorBoundary from './shared/components/GlobalErrorBoundary.tsx';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Store the root instance on the DOM element itself to survive HMR
// @ts-ignore
if (!rootElement.__reactRoot) {
  // @ts-ignore
  rootElement.__reactRoot = ReactDOM.createRoot(rootElement);
}

// @ts-ignore
const root = rootElement.__reactRoot;

root.render(
  <React.StrictMode>
    <GlobalErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </GlobalErrorBoundary>
  </React.StrictMode>
);
