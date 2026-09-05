import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
// MapLibre first: it sets .maplibregl-map { position: relative }, which would
// otherwise beat our own layout rules at equal specificity.
import 'maplibre-gl/dist/maplibre-gl.css';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
