import { IonApp, IonIcon, IonLabel, IonRouterOutlet, IonTabBar, IonTabButton, IonTabs, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { albums, book, car, map } from 'ionicons/icons';
import { Redirect, Route } from 'react-router-dom';
import { CardsPage } from './pages/CardsPage';
import { PlayPage } from './pages/PlayPage';
import { RulesPage } from './pages/RulesPage';
import { TripsPage } from './pages/TripsPage';

// iOS Safari already scrolls a focused field above the keyboard. Ionic's own scroll assist clones the input while
// it does the same job, which fights the browser and swallows keystrokes, so it is off.
setupIonicReact({ mode: 'ios', scrollAssist: false });

export function App() {
  return (
    <IonApp>
      {/* Vite's BASE_URL has a trailing slash; react-router wants none, and "" at the site root. */}
      <IonReactRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
        <IonTabs>
          <IonRouterOutlet>
            <Route exact path="/play" component={PlayPage} />
            <Route exact path="/cards" component={CardsPage} />
            <Route exact path="/rules" component={RulesPage} />
            <Route exact path="/trips" component={TripsPage} />
            <Route exact path="/">
              <Redirect to="/play" />
            </Route>
          </IonRouterOutlet>
          <IonTabBar slot="bottom" translucent>
            <IonTabButton tab="play" href="/play">
              <IonIcon icon={car} aria-hidden="true" />
              <IonLabel>Play</IonLabel>
            </IonTabButton>
            <IonTabButton tab="cards" href="/cards">
              <IonIcon icon={albums} aria-hidden="true" />
              <IonLabel>Cards</IonLabel>
            </IonTabButton>
            <IonTabButton tab="rules" href="/rules">
              <IonIcon icon={book} aria-hidden="true" />
              <IonLabel>Rules</IonLabel>
            </IonTabButton>
            <IonTabButton tab="trips" href="/trips">
              <IonIcon icon={map} aria-hidden="true" />
              <IonLabel>Trips</IonLabel>
            </IonTabButton>
          </IonTabBar>
        </IonTabs>
      </IonReactRouter>
    </IonApp>
  );
}
