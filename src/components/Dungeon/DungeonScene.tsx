import { useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import type { ThreeEvent } from '@react-three/fiber';
import { PerspectiveCamera, Plane, Html, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { useStore, MIRROR_WALL_MAP, MIRROR_FACE_MAP } from '../../engine/store';
import type { Direction, ProjectileEffect } from '../../engine/store';
import { getGameMap } from '../../data/mapLoader';
import type { GameMap, GameTile, TeleporterObject, SensorObject, WallTextObject, CardinalDir, DoorObject } from '../../types/game';
import type { Champion } from '../../data/champions';
import { Cell } from './Cell';
import type { CellRenderType } from './Cell';
import { CreatureSprite } from './CreatureSprite';
import { FloorItemMesh } from './FloorItemMesh';
import { WallSensor } from './WallSensor';
import { GRID_SIZE, WALL_HEIGHT } from '../../engine/constants';

const HALF = GRID_SIZE / 2;

// ─── Camera smooth follow ─────────────────────────────────────────────────────
const CameraController = () => {
    const { position, direction } = useStore();
    const cameraRef = useRef<THREE.PerspectiveCamera>(null);

    const targetPos = new THREE.Vector3(position[1] * GRID_SIZE, 0, position[0] * GRID_SIZE);
    const rotationMap = {
        NORTH: 0,
        EAST:  -Math.PI / 2,
        SOUTH: Math.PI,
        WEST:  Math.PI / 2,
    };
    const targetRot = rotationMap[direction as keyof typeof rotationMap];

    useFrame(() => {
        if (!cameraRef.current) return;
        cameraRef.current.position.lerp(targetPos, 0.12);
        let diff = targetRot - cameraRef.current.rotation.y;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff >  Math.PI) diff -= Math.PI * 2;
        cameraRef.current.rotation.y += diff * 0.1;
    });

    return <PerspectiveCamera ref={cameraRef} makeDefault position={[1, 0, 1]} fov={75} />;
};

// ─── Boundary wall planes ─────────────────────────────────────────────────────
const BoundaryWalls = ({ map }: { map: GameMap }) => {
    const { wall } = useTexture({ wall: '/textures/wall.png?v=2' });
    wall.wrapS = wall.wrapT = THREE.RepeatWrapping;

    const planes: React.ReactElement[] = [];

    for (const row of map.tiles) {
        for (const tile of row) {
            if (tile.type === 'Wall') continue;
            const wx = tile.x * GRID_SIZE;
            const wz = tile.y * GRID_SIZE;
            const mat = <meshBasicMaterial map={wall} side={THREE.DoubleSide} />;

            if (tile.y === 0)
                planes.push(<Plane key={`N-${tile.x}-${tile.y}`} args={[GRID_SIZE, WALL_HEIGHT]} position={[wx, 0, wz - HALF]} rotation={[0, Math.PI, 0]}>{mat}</Plane>);
            if (tile.y === map.height - 1)
                planes.push(<Plane key={`S-${tile.x}-${tile.y}`} args={[GRID_SIZE, WALL_HEIGHT]} position={[wx, 0, wz + HALF]}>{mat}</Plane>);
            if (tile.x === 0)
                planes.push(<Plane key={`W-${tile.x}-${tile.y}`} args={[GRID_SIZE, WALL_HEIGHT]} position={[wx - HALF, 0, wz]} rotation={[0, -Math.PI / 2, 0]}>{mat}</Plane>);
            if (tile.x === map.width - 1)
                planes.push(<Plane key={`E-${tile.x}-${tile.y}`} args={[GRID_SIZE, WALL_HEIGHT]} position={[wx + HALF, 0, wz]} rotation={[0, Math.PI / 2, 0]}>{mat}</Plane>);
        }
    }

    return <>{planes}</>;
};

// ─── Tile render-type derivation ──────────────────────────────────────────────

function getRenderType(tile: GameTile, level: number): CellRenderType {
    switch (tile.type) {
        case 'Wall':
            return (level === 0 && MIRROR_WALL_MAP.has(`${tile.x},${tile.y}`)) ? 'Mirror' : 'Wall';

        case 'Door':
            return 'Door';

        case 'Teleporter': {
            const tp = tile.objects.find((o): o is TeleporterObject => o.category === 'Teleporter');
            if (tp && tp.destMap !== level) {
                return tp.destMap > level ? 'StairsDown' : 'StairsUp';
            }
            return 'Floor';
        }

        default:
            return 'Floor';
    }
}

// ─── Level name overlay ───────────────────────────────────────────────────────
const LevelName = ({ level }: { level: number }) => {
    const map = getGameMap(level);
    return (
        <div style={{
            position: 'absolute',
            zIndex: 10,
            top: '12%',
            width: '100%',
            textAlign: 'center',
            color: '#c8a96e',
            fontSize: '1.4rem',
            fontFamily: 'serif',
            letterSpacing: '0.25em',
            textTransform: 'uppercase',
            textShadow: '0 0 24px rgba(200,169,110,0.7)',
            pointerEvents: 'none',
            userSelect: 'none',
            animation: 'dmLevelName 4s ease-in forwards',
        }}>
            {map.name}
        </div>
    );
};

// ─── Wall text overlay ────────────────────────────────────────────────────────

/** Dungeon Master wall text format: pure messages vs champion-data lines.
 *  Champion data has the pattern  NAME\nTITLE\n\n[MF]\n<encoded>
 *  We skip those and only show genuine messages. */
const CHAMPION_DATA_RE = /\n\n[MF]\n/;

const DIR_TO_FACE: Record<Direction, CardinalDir> = {
    NORTH: 'South',
    SOUTH: 'North',
    EAST:  'West',
    WEST:  'East',
};

const WallTextOverlay = ({
    level, position, direction, map, visibleTexts,
}: {
    level: number;
    position: [number, number];
    direction: Direction;
    map: GameMap;
    visibleTexts: Set<string>;
}) => {
    const text = useMemo(() => {
        const [y, x] = position;
        let ty = y, tx = x;
        if (direction === 'NORTH') ty--;
        else if (direction === 'SOUTH') ty++;
        else if (direction === 'EAST') tx++;
        else tx--;

        const tile = map.tiles[ty]?.[tx];
        if (!tile) return null;

        const face = DIR_TO_FACE[direction];
        for (const obj of tile.objects) {
            if (obj.category !== 'Text') continue;
            const t = obj as WallTextObject;
            if (t.tilePos !== face) continue;
            const key = `${level}_${tx}_${ty}_${t.index}`;
            if (!visibleTexts.has(key)) continue;
            if (!t.text || CHAMPION_DATA_RE.test(t.text)) continue;
            return t.text;
        }
        return null;
    }, [level, position, direction, map, visibleTexts]);

    if (!text) return null;

    return (
        <div style={{
            position: 'absolute',
            bottom: '22%',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 20,
            background: 'rgba(8,6,4,0.88)',
            border: '1px solid #6a5430',
            borderRadius: 6,
            padding: '12px 20px',
            color: '#c8a96e',
            fontFamily: '"Courier New", Courier, monospace',
            fontSize: '0.95rem',
            letterSpacing: '0.08em',
            textAlign: 'center',
            lineHeight: 1.7,
            whiteSpace: 'pre-line',
            pointerEvents: 'none',
            userSelect: 'none',
            boxShadow: '0 0 24px rgba(200,169,110,0.2)',
            maxWidth: 340,
        }}>
            {text}
        </div>
    );
};

// ─── Fog controller (extends view range when torch/light spells active) ───────
const BASE_FOG_FAR = GRID_SIZE * 7;

const FogController: React.FC = () => {
    const spellLights = useStore(s => s.spellLights);
    const { scene } = useThree();

    useFrame(() => {
        const fog = scene.fog as THREE.Fog | null;
        if (!fog) return;
        const now = Date.now();
        const active = spellLights.filter(l => l.expiresAt > now);
        const maxMult = active.length > 0 ? Math.max(...active.map(l => l.fogMult)) : 1.0;
        const target = BASE_FOG_FAR * maxMult;
        fog.far += (target - fog.far) * 0.04; // smooth fade in/out
    });

    return null;
};

// ─── Projectile renderer ──────────────────────────────────────────────────────
const PROJ_COLORS: Record<ProjectileEffect, string> = {
    fireball:  '#ff6200',
    lightning: '#aaddff',
    poison:    '#44ff66',
    plasma:    '#cc44ff',
};

const ProjectileRenderer: React.FC = () => {
    const projectiles = useStore(s => s.projectiles);
    const level = useStore(s => s.level);

    return (
        <>
            {projectiles.filter(p => p.level === level).map(p => (
                <group key={p.id} position={[p.x * GRID_SIZE, 0, p.y * GRID_SIZE]}>
                    {/* Glow outer */}
                    <mesh>
                        <sphereGeometry args={[0.28, 10, 10]} />
                        <meshBasicMaterial color={PROJ_COLORS[p.effect]} transparent opacity={0.35} />
                    </mesh>
                    {/* Core */}
                    <mesh>
                        <sphereGeometry args={[0.14, 8, 8]} />
                        <meshBasicMaterial color="#ffffff" />
                    </mesh>
                </group>
            ))}
        </>
    );
};

// ─── Scene ────────────────────────────────────────────────────────────────────
export const DungeonScene = () => {
    const {
        level, position, direction,
        openMirror, openDoors, toggleDoor,
        openTeleporters, visibleTexts, activateWallSensor,
        creatures, floorItems, pickupItem, damageEvents,
    } = useStore();
    const map = getGameMap(level);

    // Collect wall-button sensors visible this level
    const wallButtons = useMemo(() => {
        const buttons: { tileX: number; tileY: number; face: CardinalDir; sensorIndex: number }[] = [];
        for (const row of map.tiles) {
            for (const tile of row) {
                for (const obj of tile.objects) {
                    if (obj.category !== 'Sensor') continue;
                    const s = obj as SensorObject;
                    if (s.type !== 2) continue;
                    buttons.push({ tileX: tile.x, tileY: tile.y, face: s.tilePos, sensorIndex: s.index });
                }
            }
        }
        return buttons;
    }, [map]);

    const handleCellClick = (
        e: ThreeEvent<MouseEvent>,
        renderType: CellRenderType,
        x: number,
        y: number,
    ) => {
        e.stopPropagation();
        if (renderType === 'Mirror' && level === 0) {
            const champion = MIRROR_WALL_MAP.get(`${x},${y}`);
            if (champion) openMirror(champion.id);
        }
        if (renderType === 'Door') {
            toggleDoor(x, y);
        }
    };

    return (
        <div style={{ width: '100vw', height: '100vh', background: '#000', position: 'relative' }}>
            <LevelName key={level} level={level} />

            <WallTextOverlay
                level={level}
                position={position}
                direction={direction}
                map={map}
                visibleTexts={visibleTexts}
            />

            <Canvas gl={{ localClippingEnabled: true }}>
                <fog attach="fog" args={['#000000', GRID_SIZE * 2, BASE_FOG_FAR]} />
                <FogController />
                <CameraController />
                <ambientLight intensity={2.0} />

                <BoundaryWalls map={map} />

                <group>
                    {map.tiles.map((row, y) =>
                        row.map((tile, x) => {
                            const renderType = getRenderType(tile, level);
                            const champion: Champion | null =
                                renderType === 'Mirror'
                                    ? (MIRROR_WALL_MAP.get(`${x},${y}`) ?? null)
                                    : null;
                            const wallFace = renderType === 'Mirror'
                                ? MIRROR_FACE_MAP.get(`${x},${y}`)
                                : undefined;
                            const doorOpen = renderType === 'Door'
                                ? openDoors.has(`${level},${y},${x}`)
                                : undefined;
                            const doorOrientation = renderType === 'Door'
                                ? tile.orientation
                                : undefined;
                            const doorHasButton = renderType === 'Door'
                                ? (tile.objects.find(o => o.category === 'Door') as DoorObject | undefined)?.hasButton ?? false
                                : undefined;

                            return (
                                <Cell
                                    key={`${y}-${x}`}
                                    type={renderType}
                                    position={[x * GRID_SIZE, 0, y * GRID_SIZE]}
                                    champion={champion}
                                    wallFace={wallFace}
                                    doorOpen={doorOpen}
                                    doorOrientation={doorOrientation}
                                    doorHasButton={doorHasButton}
                                    onClick={(e) => handleCellClick(e, renderType, x, y)}
                                />
                            );
                        })
                    )}
                </group>

                {/* Wall-button sensors */}
                {wallButtons.map(({ tileX, tileY, face, sensorIndex }) => (
                    <WallSensor
                        key={`wsensor_${tileX}_${tileY}_${sensorIndex}`}
                        tileX={tileX}
                        tileY={tileY}
                        face={face}
                        onClick={() => activateWallSensor(level, tileX, tileY, sensorIndex)}
                    />
                ))}

                {creatures
                    .filter(c => c.alive && c.mapIndex === level)
                    .map(c => <CreatureSprite key={c.id} creature={c} />)
                }

                {/* Floating damage numbers */}
                {damageEvents.map(evt => (
                    <Html
                        key={evt.id}
                        position={[evt.x * GRID_SIZE, WALL_HEIGHT * 0.7, evt.y * GRID_SIZE]}
                        center
                        occlude={false}
                        zIndexRange={[200, 300]}
                        style={{ pointerEvents: 'none' }}
                    >
                        <div className="dmg-bubble" style={{
                            background: 'rgba(200,30,10,0.90)',
                            color: '#fff',
                            padding: '4px 11px',
                            borderRadius: 16,
                            fontFamily: 'monospace',
                            fontWeight: 'bold',
                            fontSize: 22,
                            textShadow: '0 1px 8px #000',
                            border: '1px solid rgba(255,100,60,0.8)',
                            boxShadow: '0 2px 14px rgba(0,0,0,0.8)',
                            whiteSpace: 'nowrap',
                        }}>
                            -{evt.amount}
                        </div>
                    </Html>
                ))}

                {floorItems
                    .filter(i => i.mapIndex === level)
                    .map(i => <FloorItemMesh key={i.id} item={i} onPickup={() => pickupItem(i.id)} />)
                }

                <ProjectileRenderer />
            </Canvas>
        </div>
    );
};
