import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ConfigProvider, App as AntApp, message, theme as antdTheme } from 'antd';
import frFR from 'antd/locale/fr_FR';
import App from './App.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import { MESSAGE_CONFIG } from './config/messageConfig';
import { theme } from './theme.js';
import './index.css';

// Repli pour les appels statiques a message.xxx() hors contexte React.
// La configuration reellement utilisee par l'application est celle passee
// a <AntApp message={...}>, source unique dans config/messageConfig.js.
message.config(MESSAGE_CONFIG);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ConfigProvider
      locale={frFR}
      theme={{ ...theme, algorithm: antdTheme.defaultAlgorithm }}
    >
      <AntApp message={MESSAGE_CONFIG}>
        <ToastProvider>
          <App />
        </ToastProvider>
      </AntApp>
    </ConfigProvider>
  </StrictMode>
);
