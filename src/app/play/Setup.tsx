import { useState } from 'react';
import { DEFAULT_SETTINGS, MAX_PLAYERS } from '@game/trip';
import type { Settings } from '@game/types';
import { SettingsFields } from '@app/components/SettingsFields';
import { useTrips } from '@app/state/TripStore';

const PLACEHOLDERS = ['Who holds the phone', 'Next to them', 'Behind them', 'And then', 'And then', 'And then'];

export function Setup() {
  const { trips, start } = useTrips();
  const last = trips[0];
  const [name, setName] = useState('Sunday drive');
  const [players, setPlayers] = useState<string[]>(
    last ? last.players.map((player) => player.name) : ['', '', '', ''],
  );
  const [settings, setSettings] = useState<Settings>(last?.settings ?? DEFAULT_SETTINGS);
  const named = players.filter((player) => player.trim() !== '');

  return (
    <form
      className="stack"
      style={{ gap: 'var(--space-4)' }}
      onSubmit={(event) => {
        event.preventDefault();
        if (named.length === 0) return;
        start({ name, players: named, settings });
      }}
    >
      <div className="stack">
        <h1 className="title">Take the long way.</h1>
        <p className="muted">
          A scene takes a minute. Someone opens in character, everyone else says yes to it and adds one thing,
          and the last line lands it. One phone, any number of rounds.
        </p>
      </div>

      <fieldset>
        <legend>Who’s playing?</legend>
        <p className="muted small">In seating order. Lines go round in this order.</p>
        {players.map((player, index) => (
          <div key={index} className="row" style={{ alignItems: 'center' }}>
            <input
              className="field"
              value={player}
              maxLength={24}
              autoComplete="off"
              aria-label={`Player ${index + 1}`}
              placeholder={PLACEHOLDERS[index]}
              onChange={(event) => {
                const next = [...players];
                next[index] = event.target.value;
                setPlayers(next);
              }}
            />
            {players.length > 1 && (
              <button
                type="button"
                className="icon-btn"
                style={{ flex: '0 0 auto' }}
                aria-label={`Remove player ${index + 1}`}
                onClick={() => {
                  setPlayers(players.filter((_, i) => i !== index));
                }}
              >
                ×
              </button>
            )}
          </div>
        ))}
        {players.length < MAX_PLAYERS && (
          <button
            type="button"
            className="btn btn-quiet"
            onClick={() => {
              setPlayers([...players, '']);
            }}
          >
            Add a player
          </button>
        )}
      </fieldset>

      <SettingsFields settings={settings} onChange={setSettings} />

      <label className="label">
        Name this trip
        <input
          className="field"
          value={name}
          maxLength={40}
          onChange={(event) => {
            setName(event.target.value);
          }}
        />
      </label>

      <div className="dock">
        <button type="submit" className="btn btn-primary btn-big btn-block" disabled={named.length === 0}>
          Deal the first scene
        </button>
        {named.length === 0 && <p className="muted small">Add at least one name to start.</p>}
      </div>
    </form>
  );
}
