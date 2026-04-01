import { Suspense, useRef } from 'react';
import { Plane } from '@react-three/drei';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { GRID_SIZE } from '../../engine/constants';
import type { FloorItem } from '../../types/game';
import { getItemImage } from '../../data/itemImages';

// ─── Layout ───────────────────────────────────────────────────────────────────

const FLOOR_Y = -GRID_SIZE / 2 + 0.01; // just above floor

const TILEPOS_OFFSET: Record<string, [number, number]> = {
    North: [ 0,    -0.35],
    South: [ 0,     0.35],
    East:  [ 0.35,  0   ],
    West:  [-0.35,  0   ],
};

// Item plane size (world units)
const ITEM_W = 0.52;
const ITEM_H = 0.52;

// Tilt: mostly flat on floor, angled ~20° toward viewer so it's readable
// rotation.x = -(π/2 + tilt). tilt=0.35 rad ≈ 20°
const FLOOR_TILT_X = -(Math.PI / 2 + 0.35);

// ─── Inner sprite (uses texture) ──────────────────────────────────────────────

const ItemSprite = ({ imagePath, onClick }: { imagePath: string; onClick: () => void }) => {
    const tex = useTexture(imagePath);
    tex.colorSpace = THREE.SRGBColorSpace;

    // Preserve aspect ratio: most item images are roughly square
    const aspect = tex.image ? (tex.image.width / tex.image.height) : 1;
    const w = ITEM_W;
    const h = ITEM_H / aspect;

    return (
        <Plane
            args={[w, h]}
            rotation={[FLOOR_TILT_X, 0, 0]}
            onClick={(e) => { e.stopPropagation(); onClick(); }}
        >
            <meshBasicMaterial
                map={tex}
                transparent
                alphaTest={0.05}
                side={THREE.DoubleSide}
                depthWrite={false}
            />
        </Plane>
    );
};

// ─── Fallback while texture loads ─────────────────────────────────────────────

const ItemFallback = ({ category }: { category: string }) => {
    const colors: Record<string, string> = {
        Weapon: '#b0b8c8', Armor: '#8B6914', Potion: '#e74c3c',
        Scroll: '#f0e8c8', Container: '#5C3A1E', Misc: '#d4af37',
    };
    return (
        <Plane
            args={[ITEM_W * 0.7, ITEM_H * 0.7]}
            rotation={[FLOOR_TILT_X, 0, 0]}
        >
            <meshBasicMaterial color={colors[category] ?? '#d4af37'} side={THREE.DoubleSide} />
        </Plane>
    );
};

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
    item: FloorItem;
    onPickup: () => void;
}

export const FloorItemMesh = ({ item, onPickup }: Props) => {
    const offset = TILEPOS_OFFSET[item.tilePos] ?? [0, 0];
    const worldPos: [number, number, number] = [
        item.x * GRID_SIZE + offset[0],
        FLOOR_Y,
        item.y * GRID_SIZE + offset[1],
    ];

    const imagePath = getItemImage(item.category, item.typeId);

    return (
        <group position={worldPos}>
            <Suspense fallback={<ItemFallback category={item.category} />}>
                <ItemSprite imagePath={imagePath} onClick={onPickup} />
            </Suspense>
        </group>
    );
};
