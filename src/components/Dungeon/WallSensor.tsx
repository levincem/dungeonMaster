import * as THREE from 'three';
import { GRID_SIZE, WALL_HEIGHT } from '../../engine/constants';
import type { CardinalDir } from '../../types/game';

interface Props {
    tileX: number;
    tileY: number;
    face: CardinalDir;
    onClick: () => void;
}

const HALF = GRID_SIZE / 2;
const FACE_OFFSET = HALF + 0.03;

const FACE_POS: Record<CardinalDir, [number, number, number]> = {
    North: [0,  0, -FACE_OFFSET],
    South: [0,  0,  FACE_OFFSET],
    East:  [ FACE_OFFSET, 0, 0],
    West:  [-FACE_OFFSET, 0, 0],
};
const FACE_ROT: Record<CardinalDir, [number, number, number]> = {
    North: [0, 0,            0],
    South: [0, Math.PI,      0],
    East:  [0, -Math.PI / 2, 0],
    West:  [0,  Math.PI / 2, 0],
};

export const WallSensor = ({ tileX, tileY, face, onClick }: Props) => {
    const worldX = tileX * GRID_SIZE;
    const worldZ = tileY * GRID_SIZE;
    const [ox, , oz] = FACE_POS[face];
    const [rx, ry, rz] = FACE_ROT[face];

    const btnSize = GRID_SIZE * 0.12;
    const depth    = GRID_SIZE * 0.04;

    return (
        <group
            position={[worldX + ox, 0, worldZ + oz]}
            rotation={[rx, ry, rz]}
            onClick={(e) => { e.stopPropagation(); onClick(); }}
        >
            {/* button face — protrudes slightly from wall */}
            <mesh position={[0, -WALL_HEIGHT * 0.05, depth / 2]}>
                <boxGeometry args={[btnSize, btnSize * 0.6, depth]} />
                <meshStandardMaterial color="#6a5a3a" roughness={0.6} metalness={0.4} />
            </mesh>
            {/* subtle glow plane so it's visible */}
            <mesh position={[0, -WALL_HEIGHT * 0.05, depth / 2 + 0.001]}>
                <planeGeometry args={[btnSize * 0.65, btnSize * 0.4]} />
                <meshBasicMaterial
                    color="#c8a96e"
                    transparent
                    opacity={0.35}
                    side={THREE.FrontSide}
                />
            </mesh>
        </group>
    );
};
