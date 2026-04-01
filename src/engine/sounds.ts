// ─── Sound engine ─────────────────────────────────────────────────────────────
// Pool-based audio: 2 instances per sound to allow fast overlapping triggers.

const BASE = '/sounds/';

// ─── Sound registry ───────────────────────────────────────────────────────────
const FILES: Record<string, string> = {
    // Player
    footstep:               'footstep.mp3',
    cry:                    'cry.mp3',
    plate:                  'clic.wav',
    // Party attack
    attack_slash:           'attack_slash.mp3',
    // Creature attacks
    attack_giant_scorpion:  'attack_giant_scorpion.mp3',
    attack_giggler:         'attack_giggler.mp3',
    attack_magenta_worm:    'attack_magenta_worm.mp3',
    attack_mummy_ghost:     'attack_mummy_ghost.mp3',
    attack_pain_rat_dragon: 'attack_pain_rat_dragon.mp3',
    attack_rockpile:        'attack_rockpile.mp3',
    attack_screamer_oitu:   'attack_screamer_oitu.mp3',
    attack_trolin_golem:    'attack_trolin_golem.mp3',
    attack_water_elemental: 'attack_water_elemental.mp3',
    attack_couatl:          'attack_couatl.mp3',
    attack_whoosh:          'attack_whoosh.wav',
    // Creature movement
    move_animated_armour:   'move_animated_armour.mp3',
    move_giant_wasp_couatl: 'move_giant_wasp_couatl.mp3',
    move_mummy_group:       'move_mummy_group.mp3',
    move_red_dragon:        'move_red_dragon.mp3',
    move_screamer_group:    'move_screamer_group.mp3',
    move_skeleton:          'move_skeleton.mp3',
    move_slime_water:       'move_slime_water.mp3',
};

// ─── Pool ─────────────────────────────────────────────────────────────────────
const pool: Record<string, HTMLAudioElement[]> = {};

function getOrCreate(name: string): HTMLAudioElement[] {
    if (!pool[name]) {
        const file = FILES[name];
        if (!file) return [];
        // 2 instances per sound — enough for fast retriggers
        pool[name] = [
            Object.assign(new Audio(BASE + file), { preload: 'auto' }),
            Object.assign(new Audio(BASE + file), { preload: 'auto' }),
        ];
    }
    return pool[name];
}

/** Eagerly preload all sounds (call once at app start). */
export function preloadAllSounds(): void {
    for (const name of Object.keys(FILES)) getOrCreate(name);
}

// Per-sound cooldown: prevents the same sound from re-triggering within MIN_INTERVAL ms
const MIN_INTERVAL = 250; // ms
const lastPlayed: Record<string, number> = {};

function play(name: string, volume = 0.65): void {
    const now = Date.now();
    if (now - (lastPlayed[name] ?? 0) < MIN_INTERVAL) return;
    lastPlayed[name] = now;
    const audios = getOrCreate(name);
    if (!audios.length) return;
    const audio = audios.find(a => a.paused || a.ended) ?? audios[0];
    try {
        audio.volume = volume;
        audio.currentTime = 0;
        audio.play().catch(() => { /* autoplay policy */ });
    } catch { /* ignore */ }
}

// ─── Player ───────────────────────────────────────────────────────────────────
export function playStep():  void { play('footstep', 0.60); }
export function playCry():   void { play('cry',       0.55); }
export function playPlate(): void { play('plate',     0.80); }

// ─── Party attack ─────────────────────────────────────────────────────────────
export function playPartyAttack(): void { play('attack_slash', 0.70); }

// ─── Creature sound mapping ───────────────────────────────────────────────────
// { move?: soundName, attack?: soundName }
// null move  = immaterial (silent movement)
// null attack = no specific sound (uses whoosh)
const CREATURE_SOUNDS: Record<number, { move: string | null; attack: string }> = {
     0: { move: 'move_screamer_group',    attack: 'attack_giant_scorpion'  }, // Giant Scorpion
     1: { move: 'move_slime_water',       attack: 'attack_whoosh'          }, // Swamp Slime
     2: { move: 'move_mummy_group',       attack: 'attack_giggler'         }, // Giggler
     3: { move: null,                     attack: 'attack_mummy_ghost'     }, // Wizard Eye (immaterial)
     4: { move: 'move_screamer_group',    attack: 'attack_pain_rat_dragon' }, // Pain Rat
     5: { move: 'move_screamer_group',    attack: 'attack_whoosh'          }, // Ruster
     6: { move: 'move_screamer_group',    attack: 'attack_screamer_oitu'   }, // Screamer
     7: { move: 'move_screamer_group',    attack: 'attack_rockpile'        }, // Rockpile
     8: { move: null,                     attack: 'attack_mummy_ghost'     }, // Ghost (silent move)
     9: { move: 'move_mummy_group',       attack: 'attack_trolin_golem'    }, // Stone Golem
    10: { move: 'move_mummy_group',       attack: 'attack_mummy_ghost'     }, // Mummy
    11: { move: null,                     attack: 'attack_mummy_ghost'     }, // Black Flame (immaterial)
    12: { move: 'move_skeleton',          attack: 'attack_slash'           }, // Skeleton
    13: { move: 'move_giant_wasp_couatl', attack: 'attack_couatl'          }, // Couatl
    14: { move: 'move_mummy_group',       attack: 'attack_whoosh'          }, // Vexirk
    15: { move: 'move_screamer_group',    attack: 'attack_magenta_worm'    }, // Magenta Worm
    16: { move: 'move_mummy_group',       attack: 'attack_trolin_golem'    }, // Trolin
    17: { move: 'move_giant_wasp_couatl', attack: 'attack_whoosh'          }, // Giant Wasp
    18: { move: 'move_animated_armour',   attack: 'attack_slash'           }, // Animated Armour
    19: { move: null,                     attack: 'attack_mummy_ghost'     }, // Materializer (immaterial)
    20: { move: 'move_slime_water',       attack: 'attack_water_elemental' }, // Water Elemental
    21: { move: 'move_screamer_group',    attack: 'attack_screamer_oitu'   }, // Oitu
    22: { move: 'move_mummy_group',       attack: 'attack_whoosh'          }, // Demon
    23: { move: null,                     attack: 'attack_mummy_ghost'     }, // Lord Chaos (exception)
    24: { move: 'move_red_dragon',        attack: 'attack_pain_rat_dragon' }, // Red Dragon
    25: { move: null,                     attack: 'attack_mummy_ghost'     }, // Lord Order (exception)
    26: { move: null,                     attack: 'attack_mummy_ghost'     }, // Grey Lord (exception)
};

export function playCreatureMove(typeId: number): void {
    const s = CREATURE_SOUNDS[typeId];
    if (s?.move) play(s.move, 0.55);
}

export function playCreatureAttack(typeId: number): void {
    const s = CREATURE_SOUNDS[typeId];
    if (s) play(s.attack, 0.70);
}
