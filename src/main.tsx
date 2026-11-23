import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import '@fontsource-variable/overpass';

import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

import '@theme/tokens.css';
import '@theme/app.css';

import { App } from '@app/App';
import { TripProvider } from '@app/state/TripStore';

const host = document.getElementById('root');
if (!host) throw new Error('Root element #root is missing from index.html.');
createRoot(host).render(
  <StrictMode>
    <TripProvider>
      <App />
    </TripProvider>
  </StrictMode>,
);
