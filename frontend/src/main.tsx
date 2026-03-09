import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { cleanSensitiveData, protectLocalStorage } from './lib/securityCleanup'

// 🔒 Security: Clean localStorage of any tokens on app load
cleanSensitiveData();

// 🛡️ Security: Prevent future token storage
protectLocalStorage();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <App />
);
