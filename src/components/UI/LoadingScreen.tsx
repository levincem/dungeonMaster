import { useEffect, useState } from 'react';

// ─── Asset manifest ───────────────────────────────────────────────────────────

const RUNE_IDS = [
    'bro','dain','des','ee','ew','ful','gor',
    'ir','kath','ku','lo','mon','neta','oh','on',
    'pal','ra','ros','sar','um','ven','vi','ya','zo',
];

const CREATURE_IDS = Array.from({ length: 27 }, (_, i) => i); // 0-26

const ASSETS: string[] = [
    // Runes
    ...RUNE_IDS.map(id => `/runes/${id}.png`),
    // Creature sprites
    ...CREATURE_IDS.map(id => `/sprites/creatures/creature_${id}.png`),
    // Portrait sheets
    '/portraits/screen1.png',
    '/portraits/screen2.png',
    // Dungeon textures
    '/textures/wall.png',
    '/textures/floor.png',
    '/textures/ceiling.png',
    '/textures/door.png',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function preloadImage(src: string): Promise<void> {
    return new Promise(resolve => {
        const img = new Image();
        img.onload = img.onerror = () => resolve(); // always resolve — missing file = skip
        img.src = src;
    });
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
    onDone: () => void;
}

export const LoadingScreen = ({ onDone }: Props) => {
    const [loaded, setLoaded] = useState(0);
    const [fadeOut, setFadeOut] = useState(false);
    const total = ASSETS.length;
    const pct = total > 0 ? Math.round((loaded / total) * 100) : 0;

    useEffect(() => {
        let count = 0;
        for (const src of ASSETS) {
            preloadImage(src).then(() => {
                count += 1;
                setLoaded(count);
                if (count === total) {
                    // short pause so the bar visually reaches 100 % before fading
                    setTimeout(() => setFadeOut(true), 400);
                    setTimeout(() => onDone(), 900);
                }
            });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div style={{
            position: 'fixed', inset: 0,
            background: '#050508',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            zIndex: 9999,
            opacity: fadeOut ? 0 : 1,
            transition: 'opacity 0.5s ease',
            pointerEvents: fadeOut ? 'none' : 'all',
        }}>
            {/* Vignette */}
            <div style={{
                position: 'absolute', inset: 0,
                background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.85) 100%)',
                pointerEvents: 'none',
            }} />

            {/* Logo — replace /logo.png with the real asset when available */}
            <img
                src="/logo.png"
                alt="Dungeon Master"
                draggable={false}
                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                style={{
                    maxWidth: 420,
                    width: '60vw',
                    objectFit: 'contain',
                    marginBottom: 48,
                    imageRendering: 'auto',
                    filter: 'drop-shadow(0 0 32px rgba(180,120,40,0.5))',
                }}
            />

            {/* Fallback title shown while logo.png is absent */}
            <div style={{
                fontSize: 11,
                letterSpacing: 8,
                color: 'rgba(180,140,60,0.55)',
                marginBottom: 48,
                fontFamily: '"Courier New", monospace',
                textTransform: 'uppercase',
            }}>
                Dungeon Master
            </div>

            {/* Progress bar track */}
            <div style={{
                width: 320,
                height: 3,
                background: 'rgba(255,255,255,0.07)',
                borderRadius: 2,
                overflow: 'hidden',
                position: 'relative',
            }}>
                <div style={{
                    position: 'absolute', left: 0, top: 0, bottom: 0,
                    width: `${pct}%`,
                    background: 'linear-gradient(90deg, #7a4a10, #d4a030)',
                    borderRadius: 2,
                    boxShadow: '0 0 8px rgba(200,140,30,0.7)',
                    transition: 'width 0.15s linear',
                }} />
            </div>

            {/* Percentage */}
            <div style={{
                marginTop: 14,
                fontSize: 10,
                letterSpacing: 4,
                color: 'rgba(180,140,60,0.45)',
                fontFamily: '"Courier New", monospace',
            }}>
                {pct} %
            </div>
        </div>
    );
};
