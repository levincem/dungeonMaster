import React, { useMemo, useRef, useEffect, Suspense } from 'react';
import { Box, Plane, useTexture } from '@react-three/drei';
import { useLoader, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { GRID_SIZE, WALL_HEIGHT } from '../../engine/constants';
import type { ThreeEvent } from '@react-three/fiber';
import type { Champion } from '../../data/champions';
import type { CardinalDir } from '../../types/game';

// ─── Tile render type ─────────────────────────────────────────────────────────

export type CellRenderType =
    | 'Wall'
    | 'Floor'
    | 'Mirror'
    | 'Door'
    | 'StairsDown'
    | 'StairsUp';

// ─── Portrait UV helper ───────────────────────────────────────────────────────

const CLASS_COLORS: Record<string, string> = {
    Fighter: '#c0392b',
    Ninja:   '#27ae60',
    Wizard:  '#8e44ad',
    Priest:  '#2980b9',
};

// ─── Staircase texture helpers ────────────────────────────────────────────────

function drawStairSteps(
    ctx: CanvasRenderingContext2D,
    w: number, h: number,
    steps: number,
    topFirst: boolean,
) {
    for (let i = 0; i < steps; i++) {
        const progress = i / (steps - 1);
        const indent = progress * w * 0.28;
        const brightness = Math.round(65 - progress * 35);
        const stepH = h / steps;
        const y = topFirst ? i * stepH : (steps - 1 - i) * stepH;

        const treadH = stepH * 0.45;
        ctx.fillStyle = `rgb(${brightness + 10},${brightness + 6},${brightness})`;
        ctx.fillRect(indent, y, w - 2 * indent, treadH);

        ctx.fillStyle = `rgb(${brightness - 8},${brightness - 10},${brightness - 14})`;
        ctx.fillRect(indent, y + treadH, w - 2 * indent, stepH - treadH);

        const edgeAlpha = topFirst ? 0.55 - progress * 0.45 : 0.15 + (1 - progress) * 0.45;
        ctx.fillStyle = `rgba(190,148,55,${edgeAlpha})`;
        ctx.fillRect(indent, y, w - 2 * indent, 2);

        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.fillRect(0, y, indent, stepH);
        ctx.fillRect(w - indent, y, indent, stepH);
    }
}

function makeDownStairsTexture(): THREE.CanvasTexture {
    const w = 512, h = 512;
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#0b0905';
    ctx.fillRect(0, 0, w, h);

    const archH = Math.round(h * 0.14);
    const archGrad = ctx.createLinearGradient(0, 0, 0, archH);
    archGrad.addColorStop(0, '#1e1b14');
    archGrad.addColorStop(1, '#111009');
    ctx.fillStyle = archGrad;
    ctx.fillRect(0, 0, w, archH);
    ctx.fillStyle = 'rgba(160,120,40,0.35)';
    ctx.fillRect(0, archH - 2, w, 3);

    ctx.save();
    ctx.rect(0, archH, w, h - archH);
    ctx.clip();
    drawStairSteps(ctx, w, h - archH, 7, true);
    ctx.restore();

    const fog = ctx.createLinearGradient(0, h * 0.45, 0, h);
    fog.addColorStop(0, 'rgba(0,0,0,0)');
    fog.addColorStop(1, 'rgba(0,0,0,0.88)');
    ctx.fillStyle = fog;
    ctx.fillRect(0, 0, w, h);

    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
}

function makeUpStairsTexture(): THREE.CanvasTexture {
    const w = 512, h = 512;
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#0b0905';
    ctx.fillRect(0, 0, w, h);

    drawStairSteps(ctx, w, Math.round(h * 0.86), 7, false);

    const archH = Math.round(h * 0.14);
    const archGrad = ctx.createLinearGradient(0, 0, 0, archH);
    archGrad.addColorStop(0, '#2a2318');
    archGrad.addColorStop(1, '#16130e');
    ctx.fillStyle = archGrad;
    ctx.fillRect(0, 0, w, archH);

    const glow = ctx.createLinearGradient(0, 0, 0, h * 0.5);
    glow.addColorStop(0, 'rgba(210,160,70,0.12)');
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = 'rgba(160,120,40,0.45)';
    ctx.fillRect(0, archH - 2, w, 3);

    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
}

// ─── Portrait components ──────────────────────────────────────────────────────

// Face configs: position + rotation so the portrait faces INTO the room
const HALF_LOCAL = GRID_SIZE / 2;
const FACE_OFFSET = HALF_LOCAL + 0.025;
type FaceConfig = { pos: [number,number,number]; rot: [number,number,number] };
const FACE_CONFIGS: Record<CardinalDir, FaceConfig> = {
    North: { pos: [0, 0, -FACE_OFFSET], rot: [0, 0,            0] }, // player looks south (+Z)
    South: { pos: [0, 0,  FACE_OFFSET], rot: [0, Math.PI,      0] }, // player looks north (-Z)
    East:  { pos: [ FACE_OFFSET, 0, 0], rot: [0, -Math.PI / 2, 0] }, // player looks west (-X)
    West:  { pos: [-FACE_OFFSET, 0, 0], rot: [0,  Math.PI / 2, 0] }, // player looks east (+X)
};

// Portrait + frame dimensions
const PORTRAIT_W = GRID_SIZE  * 0.62;
const PORTRAIT_H = WALL_HEIGHT * 0.62;
const FRAME_W    = PORTRAIT_W + GRID_SIZE  * 0.10;
const FRAME_H    = PORTRAIT_H + WALL_HEIGHT * 0.10;
const FRAME_BORDER = GRID_SIZE * 0.05; // thickness of visible border

function makeFrameTex(): THREE.CanvasTexture {
    const S = 256;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = S;
    const ctx = canvas.getContext('2d')!;

    // Outer fill — dark stone backing
    ctx.fillStyle = '#1a1510';
    ctx.fillRect(0, 0, S, S);

    const b = Math.round(S * (FRAME_BORDER / FRAME_W)); // border px

    // Frame body — warm wood gradient
    const grad = ctx.createLinearGradient(0, 0, S, S);
    grad.addColorStop(0,   '#6b3c1a');
    grad.addColorStop(0.3, '#8b4f22');
    grad.addColorStop(0.6, '#7a4219');
    grad.addColorStop(1,   '#5a3010');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, S, S);

    // Inner cutout (transparent → canvas alpha)
    ctx.clearRect(b, b, S - 2 * b, S - 2 * b);

    // Highlight top/left edge
    ctx.strokeStyle = 'rgba(220,160,80,0.55)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(1, S - 1); ctx.lineTo(1, 1); ctx.lineTo(S - 1, 1); ctx.stroke();

    // Shadow bottom/right edge
    ctx.strokeStyle = 'rgba(0,0,0,0.70)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(1, S - 1); ctx.lineTo(S - 1, S - 1); ctx.lineTo(S - 1, 1); ctx.stroke();

    // Inner bevel highlight
    ctx.strokeStyle = 'rgba(180,110,50,0.40)';
    ctx.lineWidth = 1;
    ctx.strokeRect(b - 1, b - 1, S - 2 * (b - 1), S - 2 * (b - 1));

    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
}

const FRAME_TEX = makeFrameTex();

/** Decorative frame always visible on mirror wall, regardless of champion state. */
const PortraitFrame: React.FC<{ wallFace: CardinalDir }> = ({ wallFace }) => {
    const { pos, rot } = FACE_CONFIGS[wallFace];
    const zOff = 0.008; // tiny Z-offset in front of wall
    const fwdVec: [number,number,number] = [
        pos[0] !== 0 ? Math.sign(pos[0]) * zOff : 0,
        0,
        pos[2] !== 0 ? Math.sign(pos[2]) * zOff : 0,
    ];
    const framePos: [number,number,number] = [pos[0] + fwdVec[0], pos[1] + fwdVec[1], pos[2] + fwdVec[2]];
    return (
        <Plane args={[FRAME_W, FRAME_H]} position={framePos} rotation={rot}>
            <meshBasicMaterial map={FRAME_TEX} transparent alphaTest={0.01} side={THREE.DoubleSide} />
        </Plane>
    );
};

/** Empty dark canvas inside the frame (shown when champion has been recruited). */
const FrameEmpty: React.FC<{ wallFace: CardinalDir }> = ({ wallFace }) => {
    const { pos, rot } = FACE_CONFIGS[wallFace];
    const zOff = 0.004;
    const fwdVec: [number,number,number] = [
        pos[0] !== 0 ? Math.sign(pos[0]) * zOff : 0,
        0,
        pos[2] !== 0 ? Math.sign(pos[2]) * zOff : 0,
    ];
    const innerPos: [number,number,number] = [pos[0] + fwdVec[0], pos[1] + fwdVec[1], pos[2] + fwdVec[2]];
    return (
        <Plane args={[PORTRAIT_W, PORTRAIT_H]} position={innerPos} rotation={rot}>
            <meshBasicMaterial color="#e8e4dc" side={THREE.DoubleSide} />
        </Plane>
    );
};

const MirrorPortrait: React.FC<{ champion: Champion; wallFace: CardinalDir }> = ({ champion, wallFace }) => {
    const tex = useTexture(champion.portrait);
    tex.colorSpace = THREE.SRGBColorSpace;

    const { pos, rot } = FACE_CONFIGS[wallFace];
    const zOff = 0.004;
    const fwdVec: [number,number,number] = [
        pos[0] !== 0 ? Math.sign(pos[0]) * zOff : 0,
        0,
        pos[2] !== 0 ? Math.sign(pos[2]) * zOff : 0,
    ];
    const imgPos: [number,number,number] = [pos[0] + fwdVec[0], pos[1] + fwdVec[1], pos[2] + fwdVec[2]];

    return (
        <Plane args={[PORTRAIT_W, PORTRAIT_H]} position={imgPos} rotation={rot}>
            <meshBasicMaterial map={tex} transparent alphaTest={0.05} side={THREE.DoubleSide} />
        </Plane>
    );
};

const ProceduralPortrait: React.FC<{ champion: Champion; wallFace: CardinalDir }> = ({ champion, wallFace }) => {
    const { pos, rot } = FACE_CONFIGS[wallFace];
    const zOff = 0.004;
    const fwdVec: [number,number,number] = [
        pos[0] !== 0 ? Math.sign(pos[0]) * zOff : 0,
        0,
        pos[2] !== 0 ? Math.sign(pos[2]) * zOff : 0,
    ];
    const imgPos: [number,number,number] = [pos[0] + fwdVec[0], pos[1] + fwdVec[1], pos[2] + fwdVec[2]];
    const color = new THREE.Color(CLASS_COLORS[champion.class] ?? '#555');
    return (
        <Plane args={[PORTRAIT_W, PORTRAIT_H]} position={imgPos} rotation={rot}>
            <meshBasicMaterial color={color} side={THREE.DoubleSide} />
        </Plane>
    );
};

// ─── Animated door ─────────────────────────────────────────────────────────────

const HALF = GRID_SIZE / 2;
// How many world-units of door bottom peek below the ceiling when fully open
const DOOR_PEEK = 0.22;
// Lift needed so the door bottom sits DOOR_PEEK below the ceiling:
//   world_bottom = lift - WALL_HEIGHT/2  =  HALF - DOOR_PEEK
//   → lift = HALF + WALL_HEIGHT/2 - DOOR_PEEK
const DOOR_LIFT = HALF + WALL_HEIGHT / 2 - DOOR_PEEK; // ≈ 2.03

// Door-panel proportion when a wall-button is present
const BTN_RATIO  = 0.22;                     // fraction of GRID_SIZE reserved for button strip
const DOOR_W_BTN = GRID_SIZE * (1 - BTN_RATIO); // 1.56 — narrower door
const BTN_W      = GRID_SIZE * BTN_RATIO;        // 0.44 — button strip
// x-offset of door panel centre (shifted left to leave room for button on the right)
const DOOR_OFF_X = -(BTN_W / 2);            // -0.22
// x-centre of the button strip
const BTN_CX     = GRID_SIZE / 2 - BTN_W / 2;   //  0.78

/** Procedural button-boss texture (64×64). */
function makeButtonTex(open: boolean): THREE.Texture {
    const S = 64;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = S;
    const ctx = canvas.getContext('2d')!;

    // Stone background
    ctx.fillStyle = '#6a5f58';
    ctx.fillRect(0, 0, S, S);

    // Subtle grain
    for (let i = 0; i < 120; i++) {
        const x = Math.random() * S, y = Math.random() * S;
        const v = Math.floor(Math.random() * 22 - 11);
        ctx.fillStyle = `rgba(${100+v},${95+v},${88+v},0.28)`;
        ctx.fillRect(x, y, 1 + Math.random() * 2, 1 + Math.random() * 2);
    }

    // Boss square (centred)
    const m = 10, bx = m, by = m, bw = S - 2*m, bh = S - 2*m;

    if (open) {
        // Recessed + green glow
        ctx.fillStyle = '#28221e';
        ctx.fillRect(bx, by, bw, bh);
        ctx.fillStyle = '#1e4210';
        ctx.fillRect(bx+2, by+2, bw-4, bh-4);
        ctx.fillStyle = '#44cc22';
        ctx.fillRect(bx+7, by+7, bw-14, bh-14);
        ctx.fillStyle = '#88ff66';
        ctx.fillRect(bx+14, by+14, bw-28, bh-28);
    } else {
        // Raised — bright edges top/left, dark edges bottom/right
        ctx.fillStyle = '#8a7e76';
        ctx.fillRect(bx, by, bw, bh);
        ctx.fillStyle = '#b4a89e'; // highlight top
        ctx.fillRect(bx, by, bw, 3);
        ctx.fillRect(bx, by, 3, bh); // highlight left
        ctx.fillStyle = '#34302c'; // shadow bottom
        ctx.fillRect(bx, by+bh-3, bw, 3);
        ctx.fillRect(bx+bw-3, by, 3, bh); // shadow right
        ctx.fillStyle = '#7a6e66'; // inner face
        ctx.fillRect(bx+4, by+4, bw-7, bh-7);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
}

const DoorMeshInner: React.FC<{
    open: boolean;
    hasButton: boolean;
    onButtonClick?: (e: ThreeEvent<MouseEvent>) => void;
}> = ({ open, hasButton, onButtonClick }) => {
    const tex     = useTexture('/textures/door.png');
    const wallTex = useTexture('/textures/wall.png?v=2');
    tex.colorSpace     = THREE.SRGBColorSpace;
    wallTex.colorSpace = THREE.SRGBColorSpace;

    const { gl } = useThree();
    useEffect(() => { gl.localClippingEnabled = true; }, [gl]);

    const groupRef = useRef<THREE.Group>(null);
    const matRef1  = useRef<THREE.MeshBasicMaterial>(null);
    const progress = useRef(open ? 1 : 0);

    const clipPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, -1, 0), HALF), []);
    useEffect(() => {
        if (matRef1.current) matRef1.current.clippingPlanes = [clipPlane];
    }, [clipPlane]);

    useFrame((_, delta) => {
        if (!groupRef.current) return;
        const target = open ? 1 : 0;
        if (progress.current === target) return;
        progress.current = target > progress.current
            ? Math.min(target, progress.current + delta)
            : Math.max(target, progress.current - delta);
        groupRef.current.position.y = DOOR_LIFT * progress.current;
    });

    // Button texture — recreated when door state changes
    const btnTex = useMemo(() => makeButtonTex(open), [open]);
    useEffect(() => () => btnTex.dispose(), [btnTex]);

    const doorW   = hasButton ? DOOR_W_BTN : GRID_SIZE;
    const doorOff = hasButton ? DOOR_OFF_X : 0;

    const handleBtnClick = (e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        onButtonClick?.(e);
    };

    return (
        <>
            {/* ── Animated door panel ── */}
            <group ref={groupRef}>
                <Plane args={[doorW, WALL_HEIGHT]} position={[doorOff, 0, 0]}>
                    <meshBasicMaterial ref={matRef1} map={tex} transparent alphaTest={0.05} side={THREE.DoubleSide} />
                </Plane>
            </group>

            {/* ── Static button strip (only when hasButton) ── */}
            {hasButton && (
                <>
                    {/* Wall background of the strip */}
                    <Plane args={[BTN_W, WALL_HEIGHT]} position={[BTN_CX, 0, 0]}>
                        <meshBasicMaterial map={wallTex} side={THREE.DoubleSide} />
                    </Plane>
                    {/* Clickable button boss */}
                    <Plane
                        args={[BTN_W * 0.72, BTN_W * 0.72]}
                        position={[BTN_CX, 0, 0.006]}
                        onClick={handleBtnClick}
                    >
                        <meshBasicMaterial map={btnTex} side={THREE.DoubleSide} transparent={false} />
                    </Plane>
                </>
            )}
        </>
    );
};

const DoorMesh: React.FC<{
    open: boolean;
    hasButton: boolean;
    onButtonClick?: (e: ThreeEvent<MouseEvent>) => void;
}> = ({ open, hasButton, onButtonClick }) => (
    <Suspense fallback={null}>
        <DoorMeshInner open={open} hasButton={hasButton} onButtonClick={onButtonClick} />
    </Suspense>
);

// ─── Cell component ───────────────────────────────────────────────────────────

interface CellProps {
    type: CellRenderType;
    position: [number, number, number];
    champion?: Champion | null;       // portrait to show (null = recruited, hide portrait)
    frameChampion?: Champion | null;  // champion for frame (always shown when Mirror)
    wallFace?: CardinalDir;
    doorOpen?: boolean;
    doorOrientation?: string;
    doorHasButton?: boolean;
    onClick?: (e: ThreeEvent<MouseEvent>) => void;
}

export const Cell: React.FC<CellProps> = ({ type, position, champion, frameChampion, wallFace, doorOpen, doorOrientation, doorHasButton, onClick }) => {
    const textures = useTexture({
        wall:    '/textures/wall.png?v=2',
        floor:   '/textures/floor.png?v=2',
        ceiling: '/textures/ceiling.png?v=2',
    });
    Object.values(textures).forEach(t => {
        t.wrapS = t.wrapT = THREE.RepeatWrapping;
        t.repeat.set(1, 1);
    });

    const downStairsTex = useMemo(() => type === 'StairsDown' ? makeDownStairsTexture() : null, [type]);
    const upStairsTex   = useMemo(() => type === 'StairsUp'   ? makeUpStairsTexture()   : null, [type]);

    const wallBlock = (
        <>
            <Box args={[GRID_SIZE, WALL_HEIGHT, GRID_SIZE]}><meshBasicMaterial map={textures.wall} /></Box>
            <Plane rotation={[Math.PI / 2, 0, 0]} position={[0, HALF, 0]} args={[GRID_SIZE, GRID_SIZE]}>
                <meshBasicMaterial map={textures.ceiling} />
            </Plane>
        </>
    );

    const floorCeiling = (
        <>
            <Plane rotation={[-Math.PI / 2, 0, 0]} position={[0, -HALF, 0]} args={[GRID_SIZE, GRID_SIZE]}>
                <meshBasicMaterial map={textures.floor} />
            </Plane>
            <Plane rotation={[Math.PI / 2, 0, 0]} position={[0, HALF, 0]} args={[GRID_SIZE, GRID_SIZE]}>
                <meshBasicMaterial map={textures.ceiling} />
            </Plane>
        </>
    );

    // ── WALL ──────────────────────────────────────────────────────────────────
    if (type === 'Wall') {
        return <group position={position}>{wallBlock}</group>;
    }

    // ── MIRROR ────────────────────────────────────────────────────────────────
    if (type === 'Mirror') {
        const face = wallFace ?? 'South';
        return (
            <group position={position} onClick={onClick}>
                {wallBlock}
                {/* Frame always present */}
                {frameChampion && <PortraitFrame wallFace={face} />}
                {/* White backing always visible inside the frame */}
                {frameChampion && <FrameEmpty wallFace={face} />}
                {/* Portrait on top (only when champion not yet recruited) */}
                {champion && wallFace && (
                    <Suspense fallback={<ProceduralPortrait champion={champion} wallFace={face} />}>
                        <MirrorPortrait champion={champion} wallFace={face} />
                    </Suspense>
                )}
            </group>
        );
    }

    // ── DOOR ──────────────────────────────────────────────────────────────────
    if (type === 'Door') {
        // WestEast doors align N-S → rotate 90° around Y
        const doorRotY = doorOrientation === 'WestEast' ? Math.PI / 2 : 0;
        const hasBtn   = doorHasButton ?? false;
        return (
            // Doors without button: the whole group is clickable (push the door)
            // Doors with button: group has no onClick — only the button mesh fires
            <group position={position} onClick={hasBtn ? undefined : onClick}>
                {floorCeiling}
                <group rotation={[0, doorRotY, 0]}>
                    <DoorMesh
                        open={doorOpen ?? false}
                        hasButton={hasBtn}
                        onButtonClick={hasBtn ? onClick : undefined}
                    />
                </group>
            </group>
        );
    }

    // ── DOWN STAIRS ───────────────────────────────────────────────────────────
    if (type === 'StairsDown') {
        return (
            <group position={position}>
                {floorCeiling}
                {downStairsTex && (
                    <Plane args={[GRID_SIZE, WALL_HEIGHT]} position={[0, 0, -HALF]} rotation={[0, Math.PI, 0]}>
                        <meshBasicMaterial map={downStairsTex} side={THREE.DoubleSide} />
                    </Plane>
                )}
            </group>
        );
    }

    // ── UP STAIRS ─────────────────────────────────────────────────────────────
    if (type === 'StairsUp') {
        return (
            <group position={position}>
                {floorCeiling}
                {upStairsTex && (
                    <Plane args={[GRID_SIZE, WALL_HEIGHT]} position={[0, 0, HALF]}>
                        <meshBasicMaterial map={upStairsTex} side={THREE.DoubleSide} />
                    </Plane>
                )}
            </group>
        );
    }

    // ── FLOOR (default for Floor, Teleporter, Water, Pit…) ───────────────────
    return <group position={position}>{floorCeiling}</group>;
};
