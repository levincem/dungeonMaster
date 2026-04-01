import { Suspense, useRef } from 'react';
import { Billboard, Plane, useTexture } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { GRID_SIZE, WALL_HEIGHT } from '../../engine/constants';
import { useStore } from '../../engine/store';
import type { CreatureInstance } from '../../types/game';

// Default sprite size
const DEFAULT_W = GRID_SIZE   * 0.65;
const DEFAULT_H = WALL_HEIGHT * 0.60;

// Per-typeId world size overrides  (w, h)
// Toutes les nouvelles images sont 2:3 (512×768) → même ratio
const SPRITE_SIZES: Record<number, [number, number]> = {
    // format : [largeur monde, hauteur monde]
    // par défaut : DEFAULT_W × DEFAULT_H
};

// Créatures avec 1 seul frame (LordOrder, GreyLord)
const SINGLE_FRAME_IDS = new Set([25, 26]);

// Durée en secondes de chaque frame d'animation idle (cycle 0→1→0→1…)
const IDLE_FRAME_SEC = 0.6;

function getSpriteSize(typeId: number): [number, number] {
    return SPRITE_SIZES[typeId] ?? [DEFAULT_W, DEFAULT_H];
}

// ─── Inner component (inside Suspense) ────────────────────────────────────────

const SpriteInner = ({ typeId }: { typeId: number }) => {
    const tex = useTexture(`/sprites/creatures/creature_${typeId}.png`);
    tex.colorSpace = THREE.SRGBColorSpace;

    const single    = SINGLE_FRAME_IDS.has(typeId);
    const nFrames   = single ? 1 : 3;
    const frameW    = 1 / nFrames;

    // Clone pour ne pas altérer la texture partagée dans le cache
    const animTex   = tex.clone();
    animTex.repeat.set(frameW, 1);
    animTex.needsUpdate = true;

    const timeRef = useRef(0);
    const frameRef = useRef(0);

    useFrame((_, delta) => {
        if (single) return;
        timeRef.current += delta;
        if (timeRef.current >= IDLE_FRAME_SEC) {
            timeRef.current = 0;
            // Cycle idle : frame 0 (static) ↔ frame 1 (walk)
            frameRef.current = frameRef.current === 0 ? 1 : 0;
            animTex.offset.setX(frameRef.current * frameW);
        }
    });

    const [w, h] = getSpriteSize(typeId);

    // Ancrage au sol : bottom du sprite = y plancher
    const floorY   = -GRID_SIZE / 2;
    const spriteY  = floorY + h / 2;
    const offsetY  = spriteY - (-GRID_SIZE / 2 + DEFAULT_H / 2);

    return (
        <Plane args={[w, h]} position={[0, offsetY, 0]}>
            <meshBasicMaterial
                map={animTex}
                transparent
                alphaTest={0.05}
                side={THREE.DoubleSide}
                depthWrite={false}
            />
        </Plane>
    );
};

// Side offset: perpendicular to player's facing direction, ~25% of a tile
const SIDE_OFFSET = GRID_SIZE * 0.25;

/** World-space (dx, dz) for the "left" side, given the player's direction. */
function sideOffsetXZ(direction: string, side: 'left' | 'right'): [number, number] {
    // Player's left = which world axis
    const sign = side === 'left' ? -1 : 1;
    switch (direction) {
        case 'NORTH': return [sign * -SIDE_OFFSET, 0];
        case 'SOUTH': return [sign *  SIDE_OFFSET, 0];
        case 'EAST':  return [0, sign * -SIDE_OFFSET];
        case 'WEST':  return [0, sign *  SIDE_OFFSET];
        default:      return [0, 0];
    }
}

// ─── Public component ──────────────────────────────────────────────────────────

export const CreatureSprite = ({ creature }: { creature: CreatureInstance }) => {
    const { x, y, typeId, side } = creature;
    const direction = useStore(s => s.direction);
    const billboardY = -GRID_SIZE / 2 + DEFAULT_H / 2;
    const [offX, offZ] = sideOffsetXZ(direction, side);
    return (
        <Billboard
            position={[x * GRID_SIZE + offX, billboardY, y * GRID_SIZE + offZ]}
            follow={true}
            lockX={true}
            lockY={false}
            lockZ={true}
        >
            <Suspense fallback={null}>
                <SpriteInner typeId={typeId} />
            </Suspense>
        </Billboard>
    );
};
