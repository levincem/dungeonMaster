import { useEffect, useRef, useState } from 'react';
import { DungeonScene } from './components/Dungeon/DungeonScene';
import { HUD } from './components/UI/HUD';
import { MirrorPopup } from './components/UI/MirrorPopup';
import { ChampionSheet } from './components/UI/ChampionSheet';
import { LoadingScreen } from './components/UI/LoadingScreen';
import { useStore } from './engine/store';
import { preloadAllSounds } from './engine/sounds';
import './App.css';

function App() {
  const [ready, setReady] = useState(false);
  const { gamePhase, activePartyMemberId, closeMirror, closePartyMember, regenTick, tickCombat, tickMonsters, tickDoors, tickSpells } = useStore();

  // ── Vitals regeneration loop ────────────────────────────────────────────────
  const lastTimeRef = useRef<number | null>(null);
  useEffect(() => {
    let rafId: number;
    const tick = (now: number) => {
      if (lastTimeRef.current !== null) {
        const delta = Math.min((now - lastTimeRef.current) / 1000, 0.1); // cap at 100ms
        regenTick(delta);
        tickCombat(delta);
        tickMonsters(delta);
        tickDoors(delta);
        tickSpells(now);
      }
      lastTimeRef.current = now;
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [regenTick, tickCombat, tickMonsters, tickDoors, tickSpells]);

  // Movement keys are handled inside HUD (with flash effect).
  // Only Escape is kept here since it concerns global popups.
  useEffect(() => { preloadAllSounds(); }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeMirror();
        closePartyMember();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [closeMirror, closePartyMember]);

  return (
    <div className="app">
      {!ready && <LoadingScreen onDone={() => setReady(true)} />}
      {ready && (
        <>
          <DungeonScene />
          <HUD />
          {gamePhase === 'mirror_open' && <MirrorPopup />}
          {activePartyMemberId !== null && <ChampionSheet />}
        </>
      )}
    </div>
  );
}

export default App;
