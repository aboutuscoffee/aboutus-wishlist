import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/aboutus-wishlist/sw.js', { scope: '/aboutus-wishlist/' }).catch(console.error);
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
