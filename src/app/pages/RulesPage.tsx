import { IonContent, IonHeader, IonItem, IonLabel, IonList, IonListHeader, IonPage, IonTitle, IonToolbar } from '@ionic/react';
import type { ReactNode } from 'react';

function Rule({ title, children }: { readonly title: string; readonly children: ReactNode }) {
  return (
    <IonItem lines="full">
      <IonLabel className="ion-text-wrap">
        <h3 style={{ fontWeight: 600, fontSize: 17 }}>{title}</h3>
        <p style={{ fontSize: 15, lineHeight: 1.45 }}>{children}</p>
      </IonLabel>
    </IonItem>
  );
}

export function RulesPage() {
  return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar>
          <IonTitle>Rules</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen color="light">
        <IonHeader collapse="condense">
          <IonToolbar color="light">
            <IonTitle size="large">Rules</IonTitle>
          </IonToolbar>
        </IonHeader>
        <div className="wrap">
          <p className="lede">
            Say yes to what the last person made true, then add one new thing. That’s the whole game. Everything below
            is how to keep it moving.
          </p>

          <IonListHeader>
            <IonLabel>A scene</IonLabel>
          </IonListHeader>
          <IonList inset>
            <Rule title="Two are cast">
              The Opener gets the Who card and speaks first, already in the Where. The Partner’s first line says who
              they are to the Opener. They take turns.
            </Rule>
            <Rule title="Everyone else is on deck">
              Walk on as a new character with one line saying who you are, or say “tag” and take over someone’s role.
            </Rule>
            <Rule title="The want holds">
              Nobody gives the Opener what they want before the last line. Make it harder, stranger or more expensive.
            </Rule>
            <Rule title="Land it">
              A soft chime means ten seconds left. The Opener’s next line is the last one: they get the want or lose it.
              Then everyone says “Scene!”
            </Rule>
          </IonList>

          <IonListHeader>
            <IonLabel>A trip</IonLabel>
          </IonListHeader>
          <IonList inset>
            <Rule title="Warm up, then drive">
              Every trip starts with a warm-up and heads for a destination. Each finished stop is a mile for everyone.
            </Rule>
            <Rule title="Keep souvenirs">
              After a scene, keep one thing from it: a character, a line, an object.
            </Rule>
            <Rule title="Arrive">
              The last stop is a scene at the destination, and the Opener has to bring a souvenir back into it.
            </Rule>
            <Rule title="Or just play one">
              Quick play skips the trip: deal one scene, one warm-up or a single card, then another.
            </Rule>
          </IonList>

          <IonListHeader>
            <IonLabel>Keeping it kind</IonLabel>
          </IonListHeader>
          <IonList inset>
            <Rule title="Tag, don’t freeze">If you’re stuck, say “tag” and someone takes over. No reason needed.</Rule>
            <Rule title="Rewind">Anyone can say “rewind” to redo a line, their own included, for any reason.</Rule>
            <Rule title="Fight the soup, not each other">
              Blame the weather, the traffic or the map. Nobody at the table is the joke.
            </Rule>
          </IonList>

          <IonListHeader>
            <IonLabel>In the car</IonLabel>
          </IonListHeader>
          <IonList inset>
            <Rule title="The driver drives">
              Turn on Voice only and say who’s driving. The driver never opens or lands a scene, never holds the phone,
              and can say “driving” to drop out at any moment.
            </Rule>
          </IonList>
          <p className="section-note" style={{ paddingTop: 8 }}>
            Built on classic improv games. The Story Spine is Kenn Adams’s; status play comes from Keith Johnstone’s
            Impro.
          </p>
          <div style={{ height: 24 }} />
        </div>
      </IonContent>
    </IonPage>
  );
}
