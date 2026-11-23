import { IonApp, IonLabel, IonRouterOutlet, IonTabBar, IonTabButton, IonTabs, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { Redirect, Route } from 'react-router-dom';
import { CardsPage } from './pages/CardsPage';
import { PlayPage } from './pages/PlayPage';
import { RulesPage } from './pages/RulesPage';
import { TripsPage } from './pages/TripsPage';

setupIonicReact({ mode: 'ios' });

export function App() {
  return (
    <IonApp>
      {/* Vite's BASE_URL has a trailing slash; react-router wants none, and "" at the site root. */}
      <IonReactRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
        <IonTabs>
          <IonRouterOutlet animated={false}>
            <Route exact path="/play" component={PlayPage} />
            <Route exact path="/cards" component={CardsPage} />
            <Route exact path="/rules" component={RulesPage} />
            <Route exact path="/trips" component={TripsPage} />
            <Route exact path="/">
              <Redirect to="/play" />
            </Route>
          </IonRouterOutlet>
          <IonTabBar slot="bottom">
            <IonTabButton tab="play" href="/play">
              <IonLabel>Play</IonLabel>
            </IonTabButton>
            <IonTabButton tab="cards" href="/cards">
              <IonLabel>Cards</IonLabel>
            </IonTabButton>
            <IonTabButton tab="rules" href="/rules">
              <IonLabel>Rules</IonLabel>
            </IonTabButton>
            <IonTabButton tab="trips" href="/trips">
              <IonLabel>Trips</IonLabel>
            </IonTabButton>
          </IonTabBar>
        </IonTabs>
      </IonReactRouter>
    </IonApp>
  );
}
