import { Suspense } from 'react';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { GRID_SIZE, WALL_HEIGHT } from '../../engine/constants';
import type { CardinalDir } from '../../types/game';

// ─── Face positioning (same convention as WallSensor / Cell FACE_CONFIGS) ─────

const HALF = GRID_SIZE / 2;
// Slightly inside the tile boundary so the decal sits on the wall face.
// polygonOffset handles depth priority vs coplanar wall geometry.
const FACE_OFFSET = HALF - 0.01;

const FACE_POS: Record<CardinalDir, [number, number, number]> = {
    North: [0, 0, -FACE_OFFSET],
    South: [0, 0,  FACE_OFFSET],
    East:  [ FACE_OFFSET, 0, 0],
    West:  [-FACE_OFFSET, 0, 0],
};
const FACE_ROT: Record<CardinalDir, [number, number, number]> = {
    North: [0, 0,            0],
    South: [0, Math.PI,      0],
    East:  [0, -Math.PI / 2, 0],
    West:  [0,  Math.PI / 2, 0],
};

// ─── Inner sprite (loads texture) ─────────────────────────────────────────────

const DecalSprite = ({ image, width, height }: { image: string; width: number; height: number }) => {
    const tex = useTexture(image);
    tex.colorSpace = THREE.SRGBColorSpace;
    return (
        <mesh frustumCulled={false}>
            <planeGeometry args={[width, height]} />
            <meshBasicMaterial
                map={tex}
                transparent
                alphaTest={0.05}
                side={THREE.DoubleSide}
                depthWrite={false}
                polygonOffset={true}
                polygonOffsetFactor={-2}
                polygonOffsetUnits={-2}
            />
        </mesh>
    );
};

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
    tileX: number;
    tileY: number;
    face: CardinalDir;
    image: string;
    /** Width of the decal plane — defaults to full GRID_SIZE */
    width?: number;
    /** Height of the decal plane — defaults to full WALL_HEIGHT */
    height?: number;
}

export const WallDecal = ({
    tileX, tileY, face, image,
    width = GRID_SIZE,
    height = WALL_HEIGHT,
}: Props) => {
    const [ox, , oz] = FACE_POS[face];
    const [rx, ry, rz] = FACE_ROT[face];

    return (
        <group
            position={[tileX * GRID_SIZE + ox, 0, tileY * GRID_SIZE + oz]}
            rotation={[rx, ry, rz]}
        >
            <Suspense fallback={null}>
                <DecalSprite image={image} width={width} height={height} />
            </Suspense>
        </group>
    );
};
