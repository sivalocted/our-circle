import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router';
import './index.css';
import App from './App.tsx';

// -------------------------------------------------------------
// ZERO-FAKE-DATA SANITIZER:
// Automatically cleanses any legacy cache or mock cousin data
// from browser storage to ensure 100% authentic production state.
// -------------------------------------------------------------
function sanitizeLegacyStorage() {
  if (typeof window === 'undefined') return;
  try {
    const fakeKeywords = ['kavya', 'rohit', 'pooja', 'arjun', 'sneha', 'vikram', '/faces/', '/avatars/'];
    const keysToCheck = [
      'ourcircle_cousin_credentials',
      'ourcircle_invited_whitelist',
      'ourcircle_current_user',
      'ourcircle_gusa_messages',
      'ourcircle_cousin_birthdays',
      'ourcircle_arcade_leaderboard',
      'ourcircle_active_cousin',
      'ourcircle_travel_contributions',
    ];

    keysToCheck.forEach((key) => {
      const val = localStorage.getItem(key);
      if (val && fakeKeywords.some((fk) => val.toLowerCase().includes(fk))) {
        localStorage.removeItem(key);
      }
    });
  } catch {
    // Gracefully continue
  }
}

sanitizeLegacyStorage();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
);
