import { IonContent, IonPage } from '@ionic/react';

export function RulesPage() {
  return (
    <IonPage>
      <IonContent className="page">
        <main className="page-inner rules">
          <h1 className="title">How to play</h1>
          <p>
            <strong>The only rule:</strong> say yes to what the last person made true, then add one new thing. That’s
            “yes, and”. You don’t have to say the words. You do have to treat their idea as real.
          </p>

          <h2>A round</h2>
          <ol>
            <li>
              <strong>Deal.</strong> A Where, a Who and usually a How. The phone reads them out. Swap any card that
              doesn’t spark.
            </li>
            <li>
              <strong>Open.</strong> The named player speaks first, as the Who, already in the Where. Don’t explain.
              Just be there.
            </li>
            <li>
              <strong>Play.</strong> Lines go round in seating order. Everyone else names who they are in their first
              line. The How rule applies to everybody.
            </li>
            <li>
              <strong>Land it.</strong> When time runs out, whoever has the turn says one last line that ends the
              scene. That’s the button.
            </li>
            <li>
              <strong>Bank it.</strong> Every finished scene is a mile for the whole group. The next player opens the
              next one.
            </li>
          </ol>

          <h2>Twists and warm-ups</h2>
          <p>
            Sometimes a Twist lands halfway through. Accept it straight away and keep going. Warm-ups are quick games
            you can play instead of a scene whenever you like. They earn a mile too.
          </p>

          <h2>Keeping it kind</h2>
          <ul>
            <li>
              <strong>Pass is free.</strong> Anyone can skip a line, no reason needed.
            </li>
            <li>
              <strong>Rewind.</strong> Say “rewind” to undo a line that felt unkind. The speaker makes a new choice.
            </li>
            <li>
              <strong>Fight the soup, not each other.</strong> Blame the weather, the traffic or the map.
            </li>
            <li>
              <strong>Nobody at the table is the joke.</strong>
            </li>
          </ul>

          <h2>Fit the space</h2>
          <p>
            Tell the phone where you are. <strong>Hands-free</strong> keeps every card playable by voice alone, so a
            driver can join without ever looking at the screen. <strong>Seated</strong> leaves out anything that needs
            you to get up. <strong>Quiet</strong> leaves out cards that get loud.
          </p>
          <p>The driver never holds the phone.</p>
        </main>
      </IonContent>
    </IonPage>
  );
}
