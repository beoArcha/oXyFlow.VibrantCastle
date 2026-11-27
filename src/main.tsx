import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initGlobalErrorHandlers } from './lib/logger';
import { LOCATION_REGISTRY, type LocationId } from './game/locations';
import defaultGameEngine from './game/loop/engine';

initGlobalErrorHandlers();

const isLoopbackHost =
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1' ||
  window.location.hostname === '[::1]';

if (import.meta.env.DEV || isLoopbackHost) {
  const requestedLocation = new URLSearchParams(window.location.search).get('location');
  if (requestedLocation && Object.prototype.hasOwnProperty.call(LOCATION_REGISTRY, requestedLocation)) {
    defaultGameEngine.resetLevel(requestedLocation as LocationId, undefined, false);
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
