import React from 'react';
import useAmbientSound from '../hooks/useAmbientSound';

export default function AmbientSound({ compact = false }) {
  const { active, volume, muted, play, stop, setVolume, toggleMute, presets } = useAmbientSound();

  const handlePreset = (id) => {
    if (active === id) {
      stop();
    } else {
      play(id);
    }
  };

  return (
    <div className="ambient-sound-bar">
      {presets.map((p) => (
        <button
          key={p.id}
          className={`ambient-preset-btn ${active === p.id ? 'active' : ''}`}
          onClick={() => handlePreset(p.id)}
          title={`${p.label} ambient sound`}
        >
          <span>{p.icon}</span>
          {!compact && <span>{p.label}</span>}
        </button>
      ))}

      {active && (
        <>
          <button className="btn-icon" onClick={toggleMute} title={muted ? 'Unmute' : 'Mute'}>
            {muted ? '🔇' : '🔊'}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="ambient-volume-slider"
            title="Volume"
          />
        </>
      )}
    </div>
  );
}