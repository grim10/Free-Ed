import 'katex/dist/katex.min.css';   // ← bring in the KaTeX styles
import './index.css';               // your Tailwind + utilities


import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
